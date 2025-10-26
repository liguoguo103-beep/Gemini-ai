import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import { addMedia, getAllMedia, deleteMedia, MediaRecord, IMAGE_STORE } from '../utils/db';
import { Icon } from './Icon';
import { useLanguage } from '../i18n/LanguageProvider';
import { ParsedApiError } from '../utils/error';

interface ImageGeneratorProps {
    activeProfileId: string;
    onHistoryChange: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ activeProfileId, onHistoryChange }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('一頭戴著皇冠的雄偉獅子，攝影棚燈光，超寫實');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<MediaRecord[]>([]);
  const [selectedImage, setSelectedImage] = useState<MediaRecord | null>(null);

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const loadSavedImages = useCallback(async (profileId: string) => {
    try {
      const images = await getAllMedia(IMAGE_STORE, profileId);
      setSavedImages(images);
    } catch (e) {
      console.error("Failed to load saved images:", e);
    }
  }, []);

  useEffect(() => {
    if (activeProfileId) {
        loadSavedImages(activeProfileId);
    }
  }, [activeProfileId, loadSavedImages]);

  const dataURLtoBlob = (dataurl: string): Blob | null => {
    const parts = dataurl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError(t('promptRequiredError'));
      return;
    }
    if (!activeProfileId) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const newImageUrl = await generateImage(prompt, aspectRatio);
      setImageUrl(newImageUrl);
      
      const blob = dataURLtoBlob(newImageUrl);
      if (blob) {
        await addMedia(IMAGE_STORE, { profileId: activeProfileId, prompt, aspectRatio, blob });
        loadSavedImages(activeProfileId);
        onHistoryChange();
      } else {
        console.error("Failed to convert data URL to blob");
      }
    } catch (e: any) {
        console.error(e);
        if (e instanceof ParsedApiError) {
            setError(t(e.key, e.params));
        } else {
            setError(t('imageGenFailedError'));
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteMedia(IMAGE_STORE, id);
      loadSavedImages(activeProfileId);
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
      onHistoryChange();
    } catch (e) {
      console.error("Failed to delete image:", e);
    }
  }, [activeProfileId, selectedImage, loadSavedImages, onHistoryChange]);

  const handleDownload = (blob: Blob, prompt: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safePrompt = prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
    a.download = `${safePrompt}.jpeg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const Thumbnail: React.FC<{ record: MediaRecord }> = ({ record }) => {
    const url = useMemo(() => URL.createObjectURL(record.blob), [record.blob]);
    
    return (
        <div className="group relative aspect-square bg-gray-200 dark:bg-base-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow-primary shadow-md hover:animate-liftUp" onClick={() => setSelectedImage(record)}>
            <img src={url} alt={record.prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                 <p className="text-white text-xs text-center line-clamp-3">{record.prompt}</p>
            </div>
            <button
                onClick={(e) => handleDelete(e, record.id!)}
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-accent/80 transition-all duration-300"
                aria-label={t('deleteVideo')}
            >
                <Icon name="trash" className="w-4 h-4" />
            </button>
        </div>
    );
  };
  
  return (
    <div className="flex flex-col w-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gradient mb-6">{t('imageGeneratorTitle')}</h2>
      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
        {/* Left Panel: Controls */}
        <div className="w-full md:w-1/3 space-y-6 overflow-y-auto flex flex-col no-scrollbar">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('promptLabel')}</label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 transition-shadow focus:animate-softGlowRing"
                placeholder={t('promptPlaceholderImage')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('aspectRatioLabel')}</label>
              <div className="grid grid-cols-5 gap-2">
                {aspectRatios.map(ar => (
                  <button 
                    key={ar} 
                    onClick={() => setAspectRatio(ar)} 
                    className={`p-2 rounded-xl transition-all duration-200 active:scale-95 text-sm hover:animate-liftUp ${aspectRatio === ar ? 'bg-gradient-primary text-white shadow-md' : 'bg-gray-100 dark:bg-base-800/50 hover:bg-gray-200 dark:hover:bg-base-700'}`}>
                    {ar}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full mt-auto bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp animate-gradient-pan bg-400%"
            >
              {isLoading ? t('generatingImage') : t('generateImage')}
            </button>
        </div>
        
        {/* Right Panel: Preview + History */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 min-h-0">
          <div className="flex items-center justify-center bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 h-3/5 flex-shrink-0 border border-primary/20">
            {isLoading && (
              <div className="text-center text-gray-800 dark:text-white animate-fadeIn">
                <Icon name="dot-spinner" className="mx-auto mb-4" />
                <p className="font-bold">{t('generatingImage')}...</p>
              </div>
            )}
            {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-scaleIn">{error}</div>}
            {imageUrl && !isLoading && (
              <img src={imageUrl} alt={prompt} className="max-h-full max-w-full object-contain rounded-2xl animate-scaleIn" />
            )}
            {!isLoading && !error && !imageUrl && (
              <div className="text-gray-500 text-center">
                <p>{t('generatedImageWillBeHere')}</p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('history')}</h3>
            {savedImages.length > 0 ? (
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {savedImages.map(img => <Thumbnail key={img.id} record={img} />)}
                </div>
            </div>
            ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                {t('noHistory')}
            </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal for viewing selected image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-base-900 border border-primary/30 rounded-3xl shadow-2xl p-4 flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
            <img src={URL.createObjectURL(selectedImage.blob)} alt={selectedImage.prompt} className="w-full max-h-[calc(90vh-120px)] object-contain rounded-2xl" />
            <div className="mt-2 p-2 bg-gray-100 dark:bg-base-950/50 rounded-2xl">
                <p className="text-gray-900 dark:text-white text-sm">{selectedImage.prompt}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('aspectRatioLabel')}: {selectedImage.aspectRatio} | {t('createdAt')}: {new Date(selectedImage.createdAt).toLocaleString()}</p>
            </div>
             <div className="absolute top-3 right-3 flex gap-2">
               <button onClick={() => handleDownload(selectedImage.blob, selectedImage.prompt)} className="p-2 bg-gradient-primary rounded-full text-white hover:opacity-90 transition-opacity active:scale-90">
                    <Icon name="download" className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedImage(null)} className="p-2 bg-gray-200 dark:bg-base-700 rounded-full text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-base-600 transition-colors active:scale-90">
                    <Icon name="close" className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
