
import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface VeoConfig {
  prompt: string;
  image?: {
    imageBytes: string;
    mimeType: string;
  };
  aspectRatio: '16:9' | '9:16';
}

const VEO_POLLING_INTERVAL = 10000; // 10 seconds

export const useVeo = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [isKeySelected, setIsKeySelected] = useState(false);

  const loadingMessages = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Rendering your vision, frame by frame...",
    "This can take a few minutes, the results are worth it!",
    "Polishing the final cut...",
  ];

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

  const generateVideo = useCallback(async (config: VeoConfig) => {
    setIsGenerating(true);
    setVideoUrl(null);
    setError(null);
    setProgressMessage(loadingMessages[0]);

    if (!isKeySelected) {
      setError("Please select an API key to generate videos.");
      setIsGenerating(false);
      return;
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

      let messageIndex = 1;
      const interval = setInterval(() => {
        setProgressMessage(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
      }, 7000);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, VEO_POLLING_INTERVAL));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      
      clearInterval(interval);
      
      if (operation.error) {
          throw new Error(`Operation failed: ${operation.error.message}`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
      }
      
      setProgressMessage("Fetching your video...");

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      
      const videoBlob = await videoResponse.blob();
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);

    } catch (e: any) {
        console.error("Veo generation error:", e);
        let errorMessage = e.message || "An unknown error occurred.";
        if (errorMessage.includes("Requested entity was not found")) {
            errorMessage = "API Key validation failed. Please re-select your key and try again.";
            setIsKeySelected(false);
        }
        setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  }, [isKeySelected]);

  return {
    isGenerating,
    videoUrl,
    error,
    progressMessage,
    generateVideo,
    isKeySelected,
    selectApiKey,
  };
};
