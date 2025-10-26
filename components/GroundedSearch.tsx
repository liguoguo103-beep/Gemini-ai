import React, { useState, useEffect } from 'react';
import { getGroundedResponse } from '../services/geminiService';
import { GroundingChunk } from '../types';
import { useLanguage } from '../i18n/LanguageProvider';
import { Icon } from './Icon';
import { ParsedApiError } from '../utils/error';

type SearchMode = 'web' | 'maps';

const GroundedSearch: React.FC = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<SearchMode>('web');
  const [prompt, setPrompt] = useState('');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);
  
  // Advanced search options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortOrder, setSortOrder] = useState<'RELEVANCE' | 'LATEST'>('RELEVANCE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (mode === 'maps' && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setLocationError(null);
        },
        (err) => {
          setLocationError(t('locationError', {error: err.message}));
        }
      );
    }
  }, [mode, location, t]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (mode === 'maps' && !location) {
        setError(t('mapSearchRequiresLocation'));
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const dateRange = (startDate && endDate) ? { startDate, endDate } : null;
      const response = await getGroundedResponse(prompt, mode === 'maps', location, sortOrder, dateRange);
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
  
  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  const renderChunks = (chunks: GroundingChunk[]) => (
    <div className="mt-4">
      <h4 className="font-bold text-gray-700 dark:text-gray-300">{t('sources')}:</h4>
      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
        {chunks.map((chunk, index) => {
          if (chunk.web?.uri) {
            return <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{chunk.web.title || chunk.web.uri}</a></li>;
          }
          if (chunk.maps?.uri) {
            return (
                <li key={index}>
                    <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{chunk.maps.title || chunk.maps.uri}</a>
                    {chunk.maps.placeAnswerSources?.reviewSnippets?.map((snippet, sIndex) => (
                        snippet?.uri && (
                          <blockquote key={sIndex} className="text-xs italic text-gray-500 dark:text-gray-400 border-l-2 border-gray-300 dark:border-base-700 pl-2 ml-4 mt-1">
                              "{snippet.reviewText || ''}" - {snippet.author || 'Unknown'} <a href={snippet.uri} className="text-primary/80">[{t('sources')}]</a>
                          </blockquote>
                        )
                    ))}
                </li>
            );
          }
          return null;
        })}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-6">{t('groundedSearchTitle')}</h2>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <div className="flex bg-gray-200 dark:bg-base-800/50 rounded-xl p-1 self-start">
                <button onClick={() => setMode('web')} className={`px-4 py-1 text-sm rounded-lg transition-all duration-200 active:scale-95 hover:animate-liftUp ${mode === 'web' ? 'bg-gradient-primary text-white shadow-md' : 'hover:bg-gray-300 dark:hover:bg-base-700'}`}>{t('webSearch')}</button>
                <button onClick={() => setMode('maps')} className={`px-4 py-1 text-sm rounded-lg transition-all duration-200 active:scale-95 hover:animate-liftUp ${mode === 'maps' ? 'bg-gradient-primary text-white shadow-md' : 'hover:bg-gray-300 dark:hover:bg-base-700'}`}>{t('mapSearch')}</button>
            </div>
            {mode === 'web' && (
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <Icon name="cog" className="w-4 h-4" />
                    <span>{t('advancedOptions')}</span>
                    <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 transition-transform duration-300" />
                </button>
            )}
        </div>

        {/* Advanced Options Section */}
        <div className={`grid transition-all duration-500 ease-modern ${showAdvanced && mode === 'web' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
           <div className="overflow-hidden">
             <div className="bg-gray-100 dark:bg-base-800/50 p-4 rounded-3xl flex flex-col sm:flex-row gap-6 mt-2">
                {/* Sort Order */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('sortOrder')}</label>
                    <div className="flex gap-2 bg-gray-200 dark:bg-base-700/50 rounded-xl p-1">
                        <button onClick={() => setSortOrder('RELEVANCE')} className={`w-full text-sm py-1 rounded-lg transition-colors duration-200 active:scale-95 ${sortOrder === 'RELEVANCE' ? 'bg-gradient-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-base-600'}`}>{t('relevance')}</button>
                        <button onClick={() => setSortOrder('LATEST')} className={`w-full text-sm py-1 rounded-lg transition-colors duration-200 active:scale-95 ${sortOrder === 'LATEST' ? 'bg-gradient-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-base-600'}`}>{t('date')}</button>
                    </div>
                </div>
                {/* Date Range */}
                <div className="flex-[2]">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('dateRange')}</label>
                        {(startDate || endDate) && <button onClick={handleClearDates} className="text-xs text-primary hover:underline">{t('clear')}</button>}
                    </div>
                    <div className="flex items-center gap-2">
                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-200 dark:bg-base-700/50 border-gray-300 dark:border-base-600 rounded-lg p-1 text-sm text-gray-800 dark:text-white" placeholder={t('startDate')} />
                         <span className="text-gray-500 dark:text-gray-400">-</span>
                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-200 dark:bg-base-700/50 border-gray-300 dark:border-base-600 rounded-lg p-1 text-sm text-gray-800 dark:text-white" placeholder={t('endDate')} />
                    </div>
                </div>
            </div>
           </div>
        </div>

        {mode === 'maps' && locationError && <div className="text-yellow-800 dark:text-yellow-400 bg-yellow-400/20 dark:bg-yellow-900/50 p-2 rounded-xl text-sm animate-fadeIn">{locationError}</div>}
        <div className="flex items-center space-x-2">
            <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={mode === 'web' ? t('promptPlaceholderWeb') : t('promptPlaceholderMap')}
            className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
            />
            <button onClick={handleSubmit} disabled={isLoading} className="bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp">
            {isLoading ? t('searching') : t('search')}
            </button>
        </div>
      </div>
      <div className="mt-4 flex-1 bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 overflow-y-auto border border-primary/20">
        {isLoading && <div className="text-center text-gray-500 dark:text-gray-400">{t('searching')}...</div>}
        {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-scaleIn">{error}</div>}
        {result && (
          <div className="animate-scaleIn">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result.text}</p>
            {result.chunks.length > 0 && renderChunks(result.chunks)}
          </div>
        )}
        {!isLoading && !result && <div className="text-gray-500">{t('searchResultsWillBeHere')}</div>}
      </div>
    </div>
  );
};

export default GroundedSearch;