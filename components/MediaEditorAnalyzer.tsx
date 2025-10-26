import React, { useState, useRef } from 'react';
import { processImage, analyzeVideoFrame } from '../services/geminiService';
import { fileToBase64, blobToBase64 } from '../utils/media';
import { Modality } from '@google/genai';
import { useLanguage } from '../i18n/LanguageProvider';
import { ParsedApiError } from '../utils/error';
import { Icon } from './Icon';

type Mode = 'edit' | 'understand_image' | 'understand_video';

const MediaEditorAnalyzer: React.FC = () => {
  const { t } = useLanguage();
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
      setError(t('fileAndPromptError'));
      return;
    }
    if(mode === 'understand_video' && !videoRef.current) {
        setError(t('videoUploadError'));
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
            throw new Error(t('error_apiGeneric', { message: 'API did not return image data.' }));
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
      if (e instanceof ParsedApiError) {
        setError(t(e.key, e.params));
      } else {
        setError(e.message || t('error_unknown'));
      }
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
  
  const modeOptions: {id: Mode, label: string}[] = [
    {id: 'edit', label: t('editImage')},
    {id: 'understand_image', label: t('analyzeImage')},
    {id: 'understand_video', label: t('analyzeVideo')}
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gradient">{t('mediaToolsTitle')}</h2>
        <div className="relative flex bg-gray-200 dark:bg-base-800/50 rounded-xl p-1">
          {modeOptions.map((option) => (
             <button 
                key={option.id}
                onClick={() => handleModeChange(option.id)} 
                className={`px-3 py-1 text-sm rounded-lg transition-colors duration-300 relative z-10 ${mode === option.id ? 'text-white' : 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white/80'}`}
              >
                {option.label}
              </button>
          ))}
          <span 
            className="absolute top-1 bottom-1 bg-gradient-primary rounded-lg transition-all duration-300 ease-modern shadow-lg"
            style={{ 
                width: `calc(100% / ${modeOptions.length} - 4px)`, 
                transform: `translateX(calc(100% * ${modeOptions.findIndex(o => o.id === mode)} + 2px))`
            }}
          />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column for input */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 border-2 border-dashed border-gray-300 dark:border-base-700">
            {!filePreview && <p className="text-gray-500 dark:text-gray-400">{t('uploadToStart')}</p>}
            {filePreview && (mode === 'edit' || mode === 'understand_image') && <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-2xl animate-scaleIn" />}
            {filePreview && mode === 'understand_video' && <video ref={videoRef} src={filePreview} controls className="max-h-full max-w-full object-contain rounded-2xl animate-scaleIn" />}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={getAcceptType()} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-primary file:text-white hover:file:opacity-90 transition-all duration-300" />
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
            placeholder={
                mode === 'edit' ? t('promptPlaceholderEdit') : 
                mode === 'understand_image' ? t('promptPlaceholderAnalyzeImage') : 
                t('promptPlaceholderAnalyzeVideo')
            }
          />
           {mode === 'edit' && (
            <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('quickEdits')}</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setPrompt(t('promptRemoveBackground'))}
                        className="text-xs bg-gray-200 dark:bg-base-700 hover:bg-gray-300 dark:hover:bg-base-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-full transition-all duration-200 active:scale-95 hover:animate-liftUp"
                    >
                        {t('removeBackground')}
                    </button>
                    <button
                        onClick={() => setPrompt(t('promptUpscaleQuality'))}
                        className="text-xs bg-gray-200 dark:bg-base-700 hover:bg-gray-300 dark:hover:bg-base-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-full transition-all duration-200 active:scale-95 hover:animate-liftUp"
                    >
                        {t('upscaleQuality')}
                    </button>
                    <button
                        onClick={() => setPrompt(t('promptVintageFilter'))}
                        className="text-xs bg-gray-200 dark:bg-base-700 hover:bg-gray-300 dark:hover:bg-base-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-full transition-all duration-200 active:scale-95 hover:animate-liftUp"
                    >
                        {t('vintageFilter')}
                    </button>
                    <button
                        onClick={() => setPrompt(t('promptConvertToSketch'))}
                        className="text-xs bg-gray-200 dark:bg-base-700 hover:bg-gray-300 dark:hover:bg-base-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-full transition-all duration-200 active:scale-95 hover:animate-liftUp"
                    >
                        {t('convertToSketch')}
                    </button>
                </div>
            </div>
           )}
          <button onClick={handleSubmit} disabled={isLoading || !file} className="w-full bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 mt-auto shadow-lg hover:shadow-primary/50 hover:animate-liftUp">
            {isLoading ? t('processing') : t('submit')}
          </button>
        </div>
        
        {/* Right column for output */}
        <div className="flex items-center justify-center bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 border border-primary/20">
          {isLoading && <Icon name="dot-spinner" />}
          {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-scaleIn">{error}</div>}
          {result && (mode === 'edit') && <img src={result} alt="Result" className="max-h-full max-w-full object-contain rounded-2xl animate-scaleIn" />}
          {result && (mode === 'understand_image' || mode === 'understand_video') && <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap p-4 bg-white/50 dark:bg-base-800/50 rounded-2xl overflow-y-auto max-h-full w-full animate-scaleIn">{result}</div>}
          {!isLoading && !error && !result && <div className="text-gray-500">{t('resultWillBeHere')}</div>}
        </div>
      </div>
    </div>
  );
};

export default MediaEditorAnalyzer;