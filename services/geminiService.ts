
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Chat, GroundingChunk } from '@google/genai';
import { fileToBase64 } from '../utils/media';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Image Generation ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });
  const base64ImageBytes = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// --- Image Editing & Understanding ---
export const processImage = async (prompt: string, imageFile: File, editMode: boolean): Promise<GenerateContentResponse> => {
    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };
    const textPart = { text: prompt };

    return ai.models.generateContent({
        model: editMode ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: editMode ? { responseModalities: [Modality.IMAGE] } : {},
    });
};

// --- Video Understanding (Frame Analysis) ---
export const analyzeVideoFrame = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using Pro for more complex analysis
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};


// --- Chatbot ---
export const createChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a helpful and friendly AI assistant. Keep your responses concise and informative.',
    },
  });
};

// --- Grounded Search ---
export const getGroundedResponse = async (
    prompt: string, 
    useMaps: boolean, 
    location: GeolocationCoordinates | null
): Promise<{ text: string, chunks: GroundingChunk[] }> => {
    const tools = [];
    if (useMaps) {
        tools.push({ googleMaps: {} });
    } else {
        tools.push({ googleSearch: {} });
    }
    
    const toolConfig = useMaps && location ? {
        retrievalConfig: {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        }
    } : undefined;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools },
        toolConfig,
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, chunks: chunks as GroundingChunk[] };
};

// --- Complex Reasoning ---
export const getComplexResponse = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    return response.text;
};

// --- Text-to-Speech ---
export const generateSpeech = async (prompt: string, voice: string): Promise<string | undefined> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
