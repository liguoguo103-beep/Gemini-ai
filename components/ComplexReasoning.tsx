
import React, { useState } from 'react';
import { getComplexResponse } from '../services/geminiService';

const ComplexReasoning: React.FC = () => {
  const [prompt, setPrompt] = useState('Explain the theory of relativity as if I were a curious high school student. Use analogies to make it understandable.');
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
      setError(e.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-1">Complex Reasoning</h2>
      <p className="text-sm text-gray-400 mb-4">Powered by Gemini 2.5 Pro with maximum thinking budget for in-depth analysis.</p>
      
      <div className="flex flex-col flex-1 gap-4">
        <textarea
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a complex prompt here..."
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isLoading ? 'Thinking...' : 'Generate Response'}
        </button>
        <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
          {isLoading && <div className="text-center text-gray-400">Generating a detailed response...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {result && <pre className="text-gray-200 whitespace-pre-wrap font-sans text-sm">{result}</pre>}
          {!isLoading && !result && <div className="text-gray-500">The response will appear here.</div>}
        </div>
      </div>
    </div>
  );
};

export default ComplexReasoning;
