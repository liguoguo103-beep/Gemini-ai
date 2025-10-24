
import React, { useState, useRef } from 'react';
import { processImage, analyzeVideoFrame } from '../services/geminiService';
import { fileToBase64, blobToBase64 } from '../utils/media';
import { Modality } from '@google/genai';

type Mode = 'edit' | 'understand_image' | 'understand_video';

const MediaEditorAnalyzer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('edit');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const resetState = () => {
      setFile(null);
      setFilePreview(null);
      setResult(null);
      setError(null);
      setPrompt('');
      if (fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleModeChange = (newMode: Mode) => {
      setMode(newMode);
      resetState();
  }

  const captureFrame = async (): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        if (!videoRef.current) return reject("Video element not found");
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context not available");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            if (blob) {
                const base64 = await blobToBase64(blob);
                resolve({base64, mimeType: blob.type});
            } else {
                reject("Failed to capture frame");
            }
        }, 'image/jpeg', 0.9);
    });
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || (!file && mode !== 'understand_video')) {
      setError('Please provide a file and a prompt.');
      return;
    }
    if(mode === 'understand_video' && !videoRef.current) {
        setError('Please upload a video file.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'edit' && file) {
        const response = await processImage(prompt, file, true);
        const part = response.candidates?.[0]?.content.parts[0];
        if (part && part.inlineData) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setResult(imageUrl);
        } else {
            throw new Error("No image data returned from API.");
        }
      } else if (mode === 'understand_image' && file) {
        const response = await processImage(prompt, file, false);
        setResult(response.text);
      } else if (mode === 'understand_video' && videoRef.current) {
        const {base64, mimeType} = await captureFrame();
        const text = await analyzeVideoFrame(prompt, base64, mimeType);
        setResult(text);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAcceptType = () => {
    switch (mode) {
        case 'edit':
        case 'understand_image':
            return 'image/*';
        case 'understand_video':
            return 'video/*';
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Media Tools</h2>
        <div className="flex bg-gray-700 rounded-md p-1">
          <button onClick={() => handleModeChange('edit')} className={`px-3 py-1 text-sm rounded ${mode === 'edit' ? 'bg-blue-600' : ''}`}>Edit Image</button>
          <button onClick={() => handleModeChange('understand_image')} className={`px-3 py-1 text-sm rounded ${mode === 'understand_image' ? 'bg-blue-600' : ''}`}>Analyze Image</button>
          <button onClick={() => handleModeChange('understand_video')} className={`px-3 py-1 text-sm rounded ${mode === 'understand_video' ? 'bg-blue-600' : ''}`}>Analyze Video</button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column for input */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-600">
            {!filePreview && <p className="text-gray-400">Upload a file to get started</p>}
            {filePreview && (mode === 'edit' || mode === 'understand_image') && <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />}
            {filePreview && mode === 'understand_video' && <video ref={videoRef} src={filePreview} controls className="max-h-full max-w-full object-contain rounded-md" />}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={getAcceptType()} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
            placeholder={
                mode === 'edit' ? "e.g., Add a retro filter" : 
                mode === 'understand_image' ? "e.g., What is in this image?" : 
                "e.g., Describe the main subject in this video frame"
            }
          />
          <button onClick={handleSubmit} disabled={isLoading || !file} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>
        
        {/* Right column for output */}
        <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4">
          {isLoading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>}
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
          {result && (mode === 'edit') && <img src={result} alt="Result" className="max-h-full max-w-full object-contain rounded-md" />}
          {result && (mode === 'understand_image' || mode === 'understand_video') && <div className="text-gray-200 whitespace-pre-wrap p-4 bg-gray-800 rounded-md overflow-y-auto max-h-full">{result}</div>}
          {!isLoading && !error && !result && <div className="text-gray-400">Result will appear here.</div>}
        </div>
      </div>
    </div>
  );
};

export default MediaEditorAnalyzer;
