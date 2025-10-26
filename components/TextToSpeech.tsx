import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/media';
import { useLanguage } from '../i18n/LanguageProvider';
import { Icon } from './Icon';

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const TextToSpeech: React.FC = () => {
  const { t, language } = useLanguage();
  const [text, setText] = useState(t('ttsDefaultText'));
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Update text when language changes
  useEffect(() => {
    setText(t('ttsDefaultText'));
  }, [t]);

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
      const audioData = await generateSpeech(text, selectedVoice, language);
      if (audioData) {
        await playAudio(audioData);
      } else {
        throw new Error("API did not return audio data.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || t('ttsError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-6">{t('ttsTitle')}</h2>
      <div className="flex flex-col flex-1 gap-4">
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
          placeholder={t('textToConvertPlaceholder')}
        />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('voice')}:</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {VOICES.map(voice => (
                <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={`flex flex-col items-center justify-center aspect-square p-2 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 transform border-2 group hover:animate-liftUp ${
                    selectedVoice === voice
                    ? 'bg-gradient-primary text-white shadow-lg border-primary/50 scale-105'
                    : 'bg-gray-100 dark:bg-base-800/50 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-base-700 border-transparent hover:border-gray-300 dark:hover:border-base-600 active:scale-95'
                }`}
                >
                    <Icon name="user" className="w-5 h-5 mb-1" />
                    <span>{voice}</span>
                </button>
            ))}
            </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp"
        >
          {isLoading ? t('generatingAudio') : t('readAloud')}
        </button>
        {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-xl text-sm animate-scaleIn">{error}</div>}
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 border border-primary/20">
            <p className="text-gray-500">{t('clickToListen')}</p>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;