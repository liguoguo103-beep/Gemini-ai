import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ParsedApiError, parseGoogleGenAIError } from '../utils/error';

interface VeoConfig {
  prompt: string;
  image?: {
    imageBytes: string;
    mimeType: string;
  };
  aspectRatio: '16:9' | '9:16';
}

const VEO_POLLING_INTERVAL = 10000; // 10 seconds

export const useVeo = (loadingMessages: string[], t: (key: string, params?: any) => string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);
  
  const selectApiKey = async () => {
    if(window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race conditions and let the API call confirm
      setIsKeySelected(true); 
    }
  };

  const generateVideo = useCallback(async (config: VeoConfig): Promise<Blob | null> => {
    setIsGenerating(true);
    setVideoUrl(null);
    setVideoBlob(null);
    setError(null);

    if (!isKeySelected) {
      setError(t('apiKeyRequired'));
      setIsGenerating(false);
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: config.prompt,
        image: config.image,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: config.aspectRatio,
        },
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, VEO_POLLING_INTERVAL));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      
      if (operation.error) {
        // The operation itself can contain a structured error
        throw new Error(`Operation failed: ${operation.error.message}`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error(t('error_unknown'));
      }
      
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      
      const blob = await videoResponse.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoBlob(blob);
      return blob;

    } catch (e: any) {
        console.error("Veo generation error:", e);
        // Handle specific case where user's selected key is bad
        if (e.message?.includes("Requested entity was not found")) {
            setError(t('error_apiKeyInvalid'));
            setIsKeySelected(false);
        } else {
            // Use the centralized parser for other errors
            const { key, params } = parseGoogleGenAIError(e);
            if (e instanceof ParsedApiError) {
              setError(t(e.key, e.params));
            } else {
              setError(t(key, params));
            }
        }
        return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isKeySelected, t]);

  return {
    isGenerating,
    videoUrl,
    videoBlob,
    error,
    generateVideo,
    isKeySelected,
    selectApiKey,
  };
};