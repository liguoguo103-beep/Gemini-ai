import React, { useState } from 'react';
import { getComplexResponse } from '../services/geminiService';
import { useLanguage } from '../i18n/LanguageProvider';
import { ParsedApiError } from '../utils/error';
import { Icon } from './Icon';

const ComplexReasoning: React.FC = () => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('請像對一個好奇的高中生一樣解釋相對論。使用類比使其易於理解。');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await getComplexResponse(prompt);
      setResult(response);
    } catch (e: any) {
      console.error(e);
      if (e instanceof ParsedApiError) {
        setError(t(e.key, e.params));
      } else {
        setError(t('error_unknown'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-1">{t('complexReasoningTitle')}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('complexReasoningDesc')}</p>
      
      <div className="flex flex-col flex-1 gap-4">
        <textarea
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
          placeholder={t('promptPlaceholderComplex')}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp"
        >
          {isLoading ? t('thinking') : t('generateResponse')}
        </button>
        <div className="flex-1 bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 overflow-y-auto border border-primary/20">
          {isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Icon name="dot-spinner" className="mx-auto mb-2" />
              {t('generatingDetailedResponse')}
            </div>
          )}
          {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-scaleIn">{error}</div>}
          {result && (
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap animate-scaleIn">
              {result}
            </div>
          )}
          {!isLoading && !result && !error && (
            <div className="text-gray-500 text-center">{t('responseWillBeHere')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplexReasoning;