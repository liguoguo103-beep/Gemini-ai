import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/media';
import { useLanguage } from '../i18n/LanguageProvider';
import { LANGUAGE_MAP } from '../services/geminiService';
import { parseGoogleGenAIError } from '../utils/error';
import { useTheme } from '../context/ThemeContext';
import { Icon } from './Icon';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const LiveConversation: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme, primaryColor, secondaryColor } = useTheme();
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [status, setStatus] = useState(t('statusIdle'));
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<{ user: string, model: string, history: {speaker: 'user' | 'model', text: string}[] }>({
    user: '',
    model: '',
    history: []
  });
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Use refs for state values needed in callbacks to avoid stale closures
  const isLiveRef = useRef(isLive);
  isLiveRef.current = isLive;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const colorsRef = useRef({primary: primaryColor, secondary: secondaryColor});
  colorsRef.current = {primary: primaryColor, secondary: secondaryColor};


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let particles: Particle[] = [];
    const numParticles = 70;

    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2,
            });
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const speedMultiplier = isLiveRef.current ? 3 : 1;
        const connectionDistance = isLiveRef.current ? 160 : 120;

        particles.forEach(p => {
            p.x += p.vx * speedMultiplier;
            p.y += p.vy * speedMultiplier;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = isLiveRef.current ? colorsRef.current.primary : (themeRef.current === 'dark' ? 'rgba(156, 163, 175, 0.6)' : 'rgba(100, 116, 139, 0.6)');
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const opacity = 1 - dist / connectionDistance;
                    if(isLiveRef.current) {
                        const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        gradient.addColorStop(0, `${colorsRef.current.primary}${Math.round(opacity*255).toString(16).padStart(2, '0')}`);
                        gradient.addColorStop(1, `${colorsRef.current.secondary}${Math.round(opacity*255).toString(16).padStart(2, '0')}`);
                        ctx.strokeStyle = gradient;
                    } else {
                         ctx.strokeStyle = themeRef.current === 'dark' ? `rgba(107, 114, 128, ${opacity * 0.25})` : `rgba(156, 163, 175, ${opacity * 0.25})`;
                    }
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
    };
  }, []);

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
    setIsPaused(false);
    setShowSubtitles(true);
    setStatus(t('statusIdle'));
  }, [t]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopConversation();
    }
  }, [stopConversation]);

  const startConversation = async () => {
    if (isLive) return;
    
    setError(null);
    setStatus(t('statusConnecting'));
    setTranscription({ user: '', model: '', history: [] });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      setIsLive(true);
      setIsPaused(false);

      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const langName = LANGUAGE_MAP[language] || 'English';
      const systemInstruction = `CRITICAL: Your response MUST be entirely in ${langName}. Do not use any other language. You are a friendly conversational AI. Be concise.`;
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemInstruction
        },
        callbacks: {
          onopen: () => {
            setStatus(t('statusConnected'));
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isPausedRef.current) return;
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

              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
            const { key, params } = parseGoogleGenAIError(e);
            setError(t(key, params));
            stopConversation();
          },
          onclose: () => {
            setStatus(t('statusClosed'));
            stopConversation();
          },
        },
      });
    } catch (e: any) {
      console.error('Failed to start conversation:', e);
      const { key, params } = parseGoogleGenAIError(e);
      setError(t(key, params) || t('micError'));
      stopConversation();
    }
  };

  const handleTogglePause = () => {
    setIsPaused(prev => {
        const isNowPaused = !prev;
        if (isNowPaused) {
            setStatus(t('statusPaused'));
        } else {
            setStatus(t('statusConnected'));
        }
        return isNowPaused;
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-6">{t('liveConvTitle')}</h2>
      <div className="relative flex-1 flex flex-col justify-end bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 overflow-hidden border border-primary/20">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        <div className={`relative z-10 w-full max-h-[calc(100%-150px)] overflow-y-auto space-y-4 p-4 transition-opacity duration-300 ${showSubtitles ? 'opacity-100' : 'opacity-0'}`}>
            {transcription.history.map((item, i) => (
                <div key={i} className={`flex w-full animate-fadeIn ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-xl md:max-w-3xl rounded-2xl p-3 shadow-sm text-gray-800 dark:text-gray-200 ${item.speaker === 'user' ? 'bg-gray-200 dark:bg-base-700/80' : 'bg-primary/20 dark:bg-primary/30'}`}>
                        <p className="text-sm text-center sm:text-left">
                            <span className="font-bold capitalize">{item.speaker === 'user' ? t('speakerUser') : t('speakerModel')}: </span>
                            {item.text}
                        </p>
                    </div>
                </div>
            ))}
            {transcription.user && (
                <div className="flex w-full justify-end">
                    <p className="w-full max-w-3xl text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right">
                        <span className="font-bold capitalize">{t('speakerUser')}: </span>
                        {transcription.user}
                    </p>
                </div>
            )}
            {transcription.model && (
                <div className="flex w-full justify-start">
                     <p className="w-full max-w-3xl text-sm text-primary dark:text-primary/90 text-center sm:text-left">
                        <span className="font-bold capitalize">{t('speakerModel')}: </span>
                        {transcription.model}
                    </p>
                </div>
            )}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center self-center mt-auto w-full">
             <div className="relative z-10 text-center bg-white/50 dark:bg-base-900/50 backdrop-blur-sm p-4 rounded-3xl border border-primary/20">
                {!isLive ? (
                     <button onClick={startConversation} className="p-4 rounded-full bg-gradient-primary text-white transition-transform duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-glow-primary" aria-label={t('startCall')}>
                        <Icon name="play" className="w-8 h-8"/>
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setShowSubtitles(s => !s)} className="p-3 rounded-full bg-gray-200 dark:bg-base-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-base-700 transition-all duration-200 active:scale-90 hover:scale-110" aria-label={showSubtitles ? t('hideSubtitles') : t('showSubtitles')}>
                            <Icon name={showSubtitles ? 'subtitles' : 'subtitles-slash'} className="w-6 h-6"/>
                        </button>
                         <button onClick={handleTogglePause} className="p-4 rounded-full bg-white dark:bg-base-700 text-gray-900 dark:text-white transition-all duration-200 active:scale-95 shadow-md hover:scale-110 hover:shadow-glow-primary" aria-label={isPaused ? t('resumeCall') : t('pauseCall')}>
                            <Icon name={isPaused ? 'play' : 'pause'} className="w-8 h-8"/>
                        </button>
                        <button onClick={stopConversation} className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200 active:scale-90 hover:scale-110" aria-label={t('endCall')}>
                            <Icon name="close" className="w-6 h-6"/>
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm bg-white/30 dark:bg-base-950/30 backdrop-blur-sm px-3 py-1 rounded-full">{t('status')}: {status}</p>
            {error && <p className="mt-2 text-red-500 dark:text-red-400 bg-red-500/10 p-2 rounded-xl text-sm w-full max-w-md mx-auto">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;