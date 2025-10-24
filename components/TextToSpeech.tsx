
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/media';

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('Hello, world! I am a Gemini model, ready to speak my mind.');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction (handled by button click)
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioCtx = audioContextRef.current;
    
    try {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
    } catch (e) {
        console.error("Error playing audio: ", e);
        setError("Could not play the generated audio.");
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const audioData = await generateSpeech(text, selectedVoice);
      if (audioData) {
        await playAudio(audioData);
      } else {
        throw new Error("API did not return audio data.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred while generating speech.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Text-to-Speech</h2>
      <div className="flex flex-col flex-1 gap-4">
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text to be spoken..."
        />
        <div className="flex items-center gap-4">
            <label htmlFor="voice" className="text-gray-300">Voice:</label>
            <select
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
            >
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isLoading ? 'Generating Audio...' : 'Speak'}
        </button>
        {error && <div className="text-red-400 bg-red-900/50 p-2 rounded-md text-sm">{error}</div>}
        <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400">Click "Speak" to hear the text synthesized.</p>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
