
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('A majestic lion wearing a crown, studio lighting, hyperrealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const url = await generateImage(prompt, aspectRatio);
      setImageUrl(url);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Image Generation (Imagen 4)</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., A cinematic shot of a raccoon detective in a rainy city"
            />
          </div>
          <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
        <div className="w-full md:w-2/3 flex items-center justify-center bg-gray-900 rounded-lg p-4 min-h-[300px]">
          {isLoading && <div className="text-white">Generating your masterpiece... <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mt-2"></div></div>}
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
          {imageUrl && <img src={imageUrl} alt="Generated" className="max-h-full max-w-full object-contain rounded-md" />}
          {!isLoading && !error && !imageUrl && <div className="text-gray-400">Your generated image will appear here.</div>}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
