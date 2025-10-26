import React, { useState, useRef, useEffect } from 'react';
import { generateCode, detectLanguage } from '../services/geminiService';
import { useLanguage } from '../i18n/LanguageProvider';
import { Icon } from './Icon';
import { addCode } from '../utils/db';
import { ParsedApiError } from '../utils/error';

declare const hljs: any;

interface CodeGeneratorProps {
  activeProfileId: string;
  onHistoryChange: () => void;
}

const LANGUAGES = [
    'Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Java', 'C++', 'C#', 
    'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'SQL', 'Shell', 'Dart'
];

// FIX: Completed the component implementation with a return statement and full JSX.
// This resolves the error "Type '... => void' is not assignable to type 'FC<...>'".
const CodeGenerator: React.FC<CodeGeneratorProps> = ({ activeProfileId, onHistoryChange }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('寫一個 Python 函數，它接受一個整數列表並返回所有偶數的總和。');
  const [language, setLanguage] = useState('Python');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (result && codeRef.current) {
        try {
            hljs.highlightElement(codeRef.current);
        } catch(e) {
            console.error("Highlighting error:", e);
        }
    }
  }, [result]);

  // Debounced effect for language detection
  useEffect(() => {
    const handler = setTimeout(async () => {
        if (prompt.trim().length > 15) { // Only detect for reasonably long prompts
            setIsDetecting(true);
            try {
                const detectedLang = await detectLanguage(prompt);
                if (detectedLang) {
                    const knownLanguage = LANGUAGES.find(l => l.toLowerCase() === detectedLang.toLowerCase());
                    if (knownLanguage) {
                        setLanguage(knownLanguage);
                    }
                }
            } catch (error) {
                console.error("Language detection failed:", error);
            } finally {
                setIsDetecting(false);
            }
        }
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt || !language) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const code = await generateCode(prompt, language);
      setResult(code);
      await addCode({ profileId: activeProfileId, prompt, language, code });
      onHistoryChange();
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

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-1">{t('codeGenTitle')}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('codeGenDesc')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Panel: Controls */}
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="prompt-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('promptLabelCode')}</label>
            <textarea
              id="prompt-code"
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
              placeholder={t('promptPlaceholderCode')}
            />
          </div>
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('languageLabel')}</label>
            <div className="relative">
                <input
                    type="text"
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow"
                    placeholder={t('languagePlaceholder')}
                    list="language-suggestions"
                />
                <datalist id="language-suggestions">
                    {LANGUAGES.map(lang => <option key={lang} value={lang} />)}
                </datalist>
                {isDetecting && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full mt-auto bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp"
          >
            {isLoading ? t('generatingCode') : t('generateCodeBtn')}
          </button>
        </div>

        {/* Right Panel: Result */}
        <div className="relative flex flex-col bg-gray-100 dark:bg-base-950/50 rounded-3xl border border-primary/20 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Icon name="dot-spinner" className="mx-auto mb-2" />
                {t('generatingCode')}...
              </div>
            </div>
          )}
          {error && <div className="p-4 text-red-500 dark:text-red-400 bg-red-500/10 m-4 rounded-2xl">{error}</div>}
          {result && !isLoading && (
            <>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg text-gray-800 dark:text-white hover:bg-white/40 dark:hover:bg-white/20 transition-colors"
                >
                  <Icon name={copyStatus ? 'check' : 'copy'} className="w-5 h-5" />
                </button>
              </div>
              <pre className="h-full overflow-auto p-4"><code ref={codeRef} className={`language-${language.toLowerCase()}`}>{result}</code></pre>
            </>
          )}
          {!isLoading && !error && !result && (
            <div className="flex items-center justify-center h-full text-gray-500">{t('codeResultPlaceholder')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;