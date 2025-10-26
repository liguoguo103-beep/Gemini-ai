import { GoogleGenAI, Modality, Type, GenerateContentResponse, Chat } from '@google/genai';
import { fileToBase64 } from '../utils/media';
import { GroundingChunk, Part } from '../types';
import { ParsedApiError, parseGoogleGenAIError } from '../utils/error';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const LANGUAGE_MAP: Record<string, string> = {
    'zh-TW': 'Traditional Chinese',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'hi': 'Hindi',
    'ar': 'Arabic',
};

// --- Image Generation ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
 try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
        },
    });
    const image = response.generatedImages?.[0];
    if (!image?.image?.imageBytes) {
      throw new Error("API did not return any image data.");
    }
    const base64ImageBytes = image.image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
 } catch (e: any) {
    console.error("Error in generateImage:", e);
    const { key, params } = parseGoogleGenAIError(e);
    throw new ParsedApiError(key, params);
 }
};

// --- Image Editing & Understanding ---
export const processImage = async (prompt: string, imageFile: File, editMode: boolean): Promise<GenerateContentResponse> => {
    try {
        const base64Data = await fileToBase64(imageFile);
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: imageFile.type,
            },
        };
        const textPart = { text: prompt };

        return await ai.models.generateContent({
            model: editMode ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
            contents: [{ parts: [imagePart, textPart] }],
            config: editMode ? { responseModalities: [Modality.IMAGE] } : {},
        });
    } catch (e: any) {
        console.error("Error in processImage:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};

// --- Video Understanding (Frame Analysis) ---
export const analyzeVideoFrame = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using Pro for more complex analysis
            contents: [{ parts: [imagePart, textPart] }],
        });
        return response.text;
    } catch (e: any) {
        console.error("Error in analyzeVideoFrame:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};


// --- Chatbot ---
export interface ChatHistory {
    role: 'user' | 'model';
    parts: Part[];
}

export const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful and friendly AI assistant. Keep your responses concise and informative.';

const SAFETY_PREAMBLE = 'You are a helpful AI assistant. Your primary goal is to provide positive, constructive, and completely safe responses. Under no circumstances should you generate content that is harmful, unethical, dangerous, illegal, or offensive in any way. Always be encouraging, supportive, and maintain a positive tone.';

export const createChat = (history: ChatHistory[] = [], systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION, language: string = 'zh-TW', model: string = 'gemini-2.5-flash'): Chat => {
  const langName = LANGUAGE_MAP[language] || 'Traditional Chinese';
  const langInstruction = `CRITICAL: Your response MUST be entirely in ${langName}. Do not use any other language.`;
  const fullSystemInstruction = `${langInstruction}\n\n${SAFETY_PREAMBLE}\n\nHere is your custom persona:\n${systemInstruction || DEFAULT_SYSTEM_INSTRUCTION}`;
  
  return ai.chats.create({
    model: model,
    history,
    config: {
      systemInstruction: fullSystemInstruction,
    },
  });
};

// --- Chat Title Generation ---
export const generateChatTitle = async (history: ChatHistory[], language: string = 'zh-TW'): Promise<string> => {
    const relevantHistory = history.slice(0, 2).map(h => {
        const textPart = h.parts.find(p => 'text' in p) as { text: string } | undefined;
        return `${h.role}: ${textPart?.text || ''}`;
    }).join('\n');
    const langName = LANGUAGE_MAP[language] || 'Traditional Chinese';
    const prompt = `Based on the beginning of this conversation, create a very short, concise title (3-5 words) in ${langName}. Examples: "Planning a Hawaii Trip", "Python Debugging Help", "Italian Dinner Recipe". Do not use quotes in your response.\n\nConversation:\n${relevantHistory}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                maxOutputTokens: 20,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        return response.text.trim().replace(/"/g, ''); // Remove quotes
    } catch (error) {
        console.error("Error generating title:", error);
        return ""; // Return empty string on error, let frontend handle fallback
    }
};


// --- Grounded Search ---
export const getGroundedResponse = async (
    prompt: string, 
    useMaps: boolean, 
    location: GeolocationCoordinates | null,
    sortOrder: 'RELEVANCE' | 'LATEST',
    dateRange: { startDate: string; endDate: string; } | null
): Promise<{ text: string, chunks: GroundingChunk[] }> => {
    
    const config: {
        tools: ({ googleMaps: {} } | { googleSearch: any })[];
        toolConfig?: any;
    } = {
        tools: []
    };

    if (useMaps) {
        config.tools.push({ googleMaps: {} });
        if (location) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }
                }
            };
        }
    } else {
        const googleSearchTool: { googleSearch: any } = { googleSearch: {} };

        if (sortOrder === 'LATEST') {
            googleSearchTool.googleSearch.orderBy = 'LATEST';
        }

        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            // Adjust for timezone offset to prevent off-by-one day errors
            start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
            end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
            
            googleSearchTool.googleSearch.dateRange = {
                startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
                endDate: { year: end.getFullYear(), month: end.getMonth() + 1, day: end.getDate() }
            };
        }

        config.tools.push(googleSearchTool);
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        // FIX: Cast the chunks from the SDK response to the local GroundingChunk type.
        // This resolves the type mismatch error in the component that consumes this service.
        return { text: response.text, chunks: chunks as GroundingChunk[] };
    } catch (e: any) {
        console.error("Error in getGroundedResponse:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};

// --- Complex Reasoning ---
export const getComplexResponse = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return response.text;
    } catch (e: any) {
        console.error("Error in getComplexResponse:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};

// --- Text-to-Speech ---
export const generateSpeech = async (prompt: string, voice: string, language: string = 'zh-TW'): Promise<string | undefined> => {
    try {
        const langName = LANGUAGE_MAP[language] || 'Traditional Chinese';
        const ttsPrompt = `Please say the following in ${langName}:\n\n${prompt}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
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
    } catch (e: any) {
        console.error("Error in generateSpeech:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};

// --- Code Generation ---
export const generateCode = async (prompt: string, language: string): Promise<string> => {
    try {
        const fullPrompt = `You are an expert programmer specializing in ${language}. 
    Your task is to write a complete, clean, and well-documented code for the following request.
    CRITICAL: Only provide the raw code itself, without any surrounding explanation, conversation, or markdown formatting like \`\`\`${language.toLowerCase()}\`\`\`. 
    The code should be ready to be copied and pasted directly into a file.

    Request:
    ---
    ${prompt}
    ---
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: fullPrompt,
            config: {
                temperature: 0.2,
            },
        });
        return response.text;
    } catch (e: any) {
        console.error("Error in generateCode:", e);
        const { key, params } = parseGoogleGenAIError(e);
        throw new ParsedApiError(key, params);
    }
};

// --- Code Language Detection ---
export const detectLanguage = async (prompt: string): Promise<string | null> => {
    const detectionPrompt = `Analyze the following user prompt for a code generation task. Identify the primary programming language mentioned. 
    Respond with ONLY the common name of the language (e.g., "Python", "JavaScript", "C++", "HTML"). 
    If no language is clearly identifiable or multiple are mentioned without a clear primary one, respond with "N/A".

    User Prompt:
    ---
    ${prompt}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: detectionPrompt,
            config: {
                maxOutputTokens: 10,
                temperature: 0,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const lang = response.text.trim();
        return lang === 'N/A' ? null : lang;
    } catch (e) {
        console.error("Error in detectLanguage:", e);
        // Fail silently as this is an auxiliary feature
        return null;
    }
};