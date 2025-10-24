
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/media';

const LiveConversation: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<{ user: string, model: string, history: {speaker: 'user' | 'model', text: string}[] }>({
    user: '',
    model: '',
    history: []
  });
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopConversation = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsLive(false);
    setStatus('Idle');
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopConversation();
    }
  }, [stopConversation]);

  const startConversation = async () => {
    if (isLive) return;
    setIsLive(true);
    setError(null);
    setStatus('Connecting...');
    setTranscription({ user: '', model: '', history: [] });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are a friendly conversational AI. Be concise."
        },
        callbacks: {
          onopen: () => {
            setStatus('Connected. Speak now.');
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
              }
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription) {
                  setTranscription(prev => ({...prev, user: prev.user + message.serverContent!.inputTranscription!.text}));
              }
              if (message.serverContent?.outputTranscription) {
                  setTranscription(prev => ({...prev, model: prev.model + message.serverContent!.outputTranscription!.text}));
              }
              if (message.serverContent?.turnComplete) {
                  setTranscription(prev => {
                      const newHistory = [...prev.history];
                      if (prev.user.trim()) newHistory.push({ speaker: 'user', text: prev.user.trim() });
                      if (prev.model.trim()) newHistory.push({ speaker: 'model', text: prev.model.trim() });
                      return { user: '', model: '', history: newHistory };
                  });
              }

              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
              if (audioData) {
                  const audioCtx = outputAudioContextRef.current!;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(audioData), audioCtx, 24000, 1);
                  const source = audioCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioCtx.destination);
                  source.addEventListener('ended', () => {
                      audioSourcesRef.current.delete(source);
                  });
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  audioSourcesRef.current.add(source);
              }
              
              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => source.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setError('An error occurred during the session.');
            stopConversation();
          },
          onclose: () => {
            setStatus('Session closed.');
            stopConversation();
          },
        },
      });
    } catch (e: any) {
      console.error('Failed to start conversation:', e);
      setError(e.message || 'Could not start microphone.');
      stopConversation();
    }
  };

  const toggleConversation = () => {
    if (isLive) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Live Conversation & Transcription</h2>
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-lg p-4">
        <div className="text-center">
            <button onClick={toggleConversation} className={`px-8 py-4 rounded-full font-bold text-lg transition-colors ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isLive ? 'Stop Conversation' : 'Start Conversation'}
            </button>
            <p className="mt-4 text-gray-400">Status: {status}</p>
            {error && <p className="mt-2 text-red-400">{error}</p>}
        </div>
        <div className="w-full mt-6 space-y-4 max-h-96 overflow-y-auto p-4 bg-gray-800 rounded-md">
            {transcription.history.map((item, i) => (
                <div key={i} className={`p-2 rounded-md ${item.speaker === 'user' ? 'bg-gray-700 text-right' : 'bg-blue-900/50 text-left'}`}>
                    <span className="font-bold capitalize">{item.speaker}: </span>{item.text}
                </div>
            ))}
            {transcription.user && <div className="p-2 text-gray-400 text-right">User: {transcription.user}</div>}
            {transcription.model && <div className="p-2 text-blue-300 text-left">Model: {transcription.model}</div>}
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
