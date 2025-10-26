import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useVeo } from '../hooks/useVeo';
import { fileToBase64 } from '../utils/media';
import { addMedia, getAllMedia, deleteMedia, MediaRecord, VIDEO_STORE } from '../utils/db';
import { Icon } from './Icon';
import { useLanguage } from '../i18n/LanguageProvider';

interface VideoGeneratorProps {
    activeProfileId: string;
    onHistoryChange: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ activeProfileId, onHistoryChange }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('一隻雄偉的鷹在日出時飛越壯麗的大峽谷。');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<MediaRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This is no longer used for the loading message, but kept for the hook.
  const loadingMessages = useMemo(() => [
    t('veoLoading1'), t('veoLoading2'), t('veoLoading3'),
    t('veoLoading4'), t('veoLoading5'), t('gettingYourVideo')
  ], [t]);

  const {
    isGenerating,
    videoUrl,
    error,
    generateVideo,
    isKeySelected,
    selectApiKey,
  } = useVeo(loadingMessages, t);
  
  const loadSavedVideos = useCallback(async (profileId: string) => {
    try {
      const videos = await getAllMedia(VIDEO_STORE, profileId);
      setSavedVideos(videos);
    } catch (e) {
      console.error("Failed to load saved videos:", e);
    }
  }, []);

  useEffect(() => {
    if (activeProfileId) {
        loadSavedVideos(activeProfileId);
    }
  }, [activeProfileId, loadSavedVideos]);

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
    if (!prompt || !activeProfileId) return;

    let imagePayload;
    if (imageFile) {
      const imageBytes = await fileToBase64(imageFile);
      imagePayload = { imageBytes, mimeType: imageFile.type };
    }

    const blob = await generateVideo({ prompt, aspectRatio, image: imagePayload });
    if (blob) {
        await addMedia(VIDEO_STORE, { profileId: activeProfileId, prompt, aspectRatio, blob });
        loadSavedVideos(activeProfileId);
        onHistoryChange();
    }
  };
  
  const handleDelete = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteMedia(VIDEO_STORE, id);
      loadSavedVideos(activeProfileId);
      if (selectedVideo?.id === id) {
        setSelectedVideo(null);
      }
      onHistoryChange();
    } catch (e) {
      console.error("Failed to delete video:", e);
    }
  }, [activeProfileId, selectedVideo, loadSavedVideos, onHistoryChange]);

  const handleDownload = (blob: Blob, prompt: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safePrompt = prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
    a.download = `${safePrompt}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const Thumbnail: React.FC<{ record: MediaRecord }> = ({ record }) => {
    const url = useMemo(() => URL.createObjectURL(record.blob), [record.blob]);
    
    return (
        <div className="group relative aspect-video bg-gray-200 dark:bg-base-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow-primary shadow-md hover:animate-liftUp" onClick={() => setSelectedVideo(record)}>
            <video src={url} className="w-full h-full object-cover" preload="metadata" />
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
       <h2 className="text-3xl font-bold text-gradient mb-6 flex-shrink-0">{t('videoGeneratorTitle')}</h2>
       {!isKeySelected && (
         <div className="bg-yellow-400/20 dark:bg-yellow-900/50 border border-yellow-500/50 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 p-4 rounded-2xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
             <div>
                 <p className="font-bold">{t('apiKeyRequired')}</p>
                 <p className="text-sm">{t('apiKeyDescription')} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900 dark:hover:text-yellow-200">{t('billingInfoLink')}</a>.</p>
             </div>
             <button onClick={selectApiKey} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-xl hover:bg-yellow-600 transition-colors active:scale-95 w-full sm:w-auto flex-shrink-0">
                 {t('selectKey')}
             </button>
         </div>
       )}
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
                placeholder={t('promptPlaceholderVideo')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('aspectRatioLabel')}</label>
              <div className="flex gap-2 bg-gray-100 dark:bg-base-800/50 p-1 rounded-xl">
                <button onClick={() => setAspectRatio('16:9')} className={`w-full p-2 rounded-lg transition-all duration-200 active:scale-95 hover:animate-liftUp ${aspectRatio === '16:9' ? 'bg-gradient-primary text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-base-700'}`}>{`16:9`}</button>
                <button onClick={() => setAspectRatio('9:16')} className={`w-full p-2 rounded-lg transition-all duration-200 active:scale-95 hover:animate-liftUp ${aspectRatio === '9:16' ? 'bg-gradient-primary text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-base-700'}`}>{`9:16`}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('optionalStartImage')}</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-primary file:text-white hover:file:opacity-90 transition-all duration-300"
              />
              {imagePreview && (
                  <div className="mt-2 relative animate-fadeIn">
                      <img src={imagePreview} alt="Preview" className="w-full rounded-2xl" />
                      <button onClick={handleClearImage} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                  </div>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isKeySelected}
              className="w-full mt-auto bg-gradient-primary text-white font-bold py-3 px-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary/50 hover:animate-liftUp animate-gradient-pan bg-400%"
            >
              {isGenerating ? t('generatingVideo') : t('generateVideo')}
            </button>
        </div>
        {/* Right Panel: Preview + History */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 min-h-0">
          <div className="flex items-center justify-center bg-gray-100 dark:bg-base-950/50 rounded-3xl p-4 h-3/5 flex-shrink-0 border border-primary/20">
            {isGenerating && (
              <div className="text-center text-gray-800 dark:text-white animate-fadeIn">
                <Icon name="dot-spinner" className="mx-auto mb-4" />
                <p className="font-bold">{t('generatingVideo')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('videoGenTakesTime')}</p>
              </div>
            )}
            {error && <div className="text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl animate-scaleIn">{error}</div>}
            {videoUrl && (
              <video src={videoUrl} controls autoPlay loop className="max-h-full max-w-full object-contain rounded-2xl animate-scaleIn" />
            )}
            {!isGenerating && !error && !videoUrl && (
              <div className="text-gray-500 text-center">
                {t('generatedVideoWillBeHere')}
                <p className="text-xs mt-2">{t('videoGenTakesTime')}</p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('history')}</h3>
            {savedVideos.length > 0 ? (
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {savedVideos.map(vid => <Thumbnail key={vid.id} record={vid} />)}
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

      {/* Modal for viewing selected video */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setSelectedVideo(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-base-900 border border-primary/30 rounded-3xl shadow-2xl p-4 flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
            <video src={URL.createObjectURL(selectedVideo.blob)} controls autoPlay loop className="w-full max-h-[calc(90vh-120px)] object-contain rounded-2xl" />
            <div className="mt-2 p-2 bg-gray-100 dark:bg-base-950/50 rounded-2xl">
                <p className="text-gray-900 dark:text-white text-sm">{selectedVideo.prompt}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('aspectRatioLabel')}: {selectedVideo.aspectRatio} | {t('createdAt')}: {new Date(selectedVideo.createdAt).toLocaleString()}</p>
            </div>
             <div className="absolute top-3 right-3 flex gap-2">
               <button onClick={() => handleDownload(selectedVideo.blob, selectedVideo.prompt)} className="p-2 bg-gradient-primary rounded-full text-white hover:opacity-90 transition-opacity active:scale-90">
                    <Icon name="download" className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedVideo(null)} className="p-2 bg-gray-200 dark:bg-base-700 rounded-full text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-base-600 transition-colors active:scale-90">
                    <Icon name="close" className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
