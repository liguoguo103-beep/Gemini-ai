
import React, { useState, useRef } from 'react';
import { useVeo } from '../hooks/useVeo';
import { fileToBase64 } from '../utils/media';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('A majestic eagle soaring over a grand canyon at sunrise.');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isGenerating,
    videoUrl,
    error,
    progressMessage,
    generateVideo,
    isKeySelected,
    selectApiKey,
  } = useVeo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    let imagePayload;
    if (imageFile) {
      const imageBytes = await fileToBase64(imageFile);
      imagePayload = { imageBytes, mimeType: imageFile.type };
    }

    generateVideo({ prompt, aspectRatio, image: imagePayload });
  };
  
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Video Generation (Veo)</h2>
      {!isKeySelected && (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-md mb-4 flex items-center justify-between">
            <div>
                <p className="font-bold">API Key Required for Veo</p>
                <p className="text-sm">Video generation requires selecting an API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Billing information</a> may be required.</p>
            </div>
            <button onClick={selectApiKey} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors">
                Select Key
            </button>
        </div>
      )}
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
              placeholder="e.g., A futuristic car driving through a neon-lit city"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              <button onClick={() => setAspectRatio('16:9')} className={`w-full p-2 rounded-md ${aspectRatio === '16:9' ? 'bg-blue-600' : 'bg-gray-700'}`}>16:9</button>
              <button onClick={() => setAspectRatio('9:16')} className={`w-full p-2 rounded-md ${aspectRatio === '9:16' ? 'bg-blue-600' : 'bg-gray-700'}`}>9:16</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Optional Start Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
             {imagePreview && (
                <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full rounded-md" />
                    <button onClick={handleClearImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs">&times;</button>
                </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !isKeySelected}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isGenerating ? 'Generating Video...' : 'Generate Video'}
          </button>
        </div>
        <div className="w-full md:w-2/3 flex items-center justify-center bg-gray-900 rounded-lg p-4 min-h-[300px]">
          {isGenerating && (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="font-bold">Generating your video...</p>
              <p className="text-sm text-gray-400 mt-2">{progressMessage}</p>
            </div>
          )}
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
          {videoUrl && (
            <video src={videoUrl} controls autoPlay loop className="max-h-full max-w-full object-contain rounded-md" />
          )}
          {!isGenerating && !error && !videoUrl && (
            <div className="text-gray-400 text-center">
              Your generated video will appear here.
              <p className="text-xs mt-2">(Generation can take several minutes)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
