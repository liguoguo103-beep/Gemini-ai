
import React, { useState, useEffect } from 'react';
import { getGroundedResponse } from '../services/geminiService';
import { GroundingChunk } from '../types';

type SearchMode = 'web' | 'maps';

const GroundedSearch: React.FC = () => {
  const [mode, setMode] = useState<SearchMode>('web');
  const [prompt, setPrompt] = useState('');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);

  useEffect(() => {
    if (mode === 'maps' && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setLocationError(null);
        },
        (err) => {
          setLocationError(`Error getting location: ${err.message}. Please enable location permissions.`);
        }
      );
    }
  }, [mode, location]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (mode === 'maps' && !location) {
        setError("Location is required for Maps search and is currently unavailable.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getGroundedResponse(prompt, mode === 'maps', location);
      setResult(response);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChunks = (chunks: GroundingChunk[]) => (
    <div className="mt-4">
      <h4 className="font-bold text-gray-300">Sources:</h4>
      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
        {chunks.map((chunk, index) => {
          if (chunk.web) {
            return <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{chunk.web.title}</a></li>;
          }
          if (chunk.maps) {
            return (
                <li key={index}>
                    <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{chunk.maps.title}</a>
                    {chunk.maps.placeAnswerSources?.reviewSnippets?.map((snippet, sIndex) => (
                        <blockquote key={sIndex} className="text-xs italic text-gray-400 border-l-2 border-gray-600 pl-2 ml-4 mt-1">
                            "{snippet.reviewText}" - {snippet.author} <a href={snippet.uri} className="text-blue-500">[source]</a>
                        </blockquote>
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
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Grounded Search</h2>
      <div className="flex bg-gray-700 rounded-md p-1 mb-4 self-start">
        <button onClick={() => setMode('web')} className={`px-4 py-1 text-sm rounded ${mode === 'web' ? 'bg-blue-600' : ''}`}>Web Search</button>
        <button onClick={() => setMode('maps')} className={`px-4 py-1 text-sm rounded ${mode === 'maps' ? 'bg-blue-600' : ''}`}>Maps Search</button>
      </div>
      {mode === 'maps' && locationError && <div className="text-yellow-400 bg-yellow-900/50 p-2 rounded-md text-sm mb-4">{locationError}</div>}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={mode === 'web' ? 'e.g., Who won the latest F1 race?' : 'e.g., Good pizza places nearby'}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
          {isLoading ? '...' : 'Search'}
        </button>
      </div>
      <div className="mt-6 flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
        {isLoading && <div className="text-center text-gray-400">Searching...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {result && (
          <div>
            <p className="text-gray-200 whitespace-pre-wrap">{result.text}</p>
            {result.chunks.length > 0 && renderChunks(result.chunks)}
          </div>
        )}
        {!isLoading && !result && <div className="text-gray-500">Search results will appear here.</div>}
      </div>
    </div>
  );
};

export default GroundedSearch;
