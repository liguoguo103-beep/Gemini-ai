import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { functionDeclarations, functionApi } from '../services/functionCallingService';
import { getOfflineResponse } from '../services/offlineService';
import { useLanguage } from '../i18n/LanguageProvider';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'function_call' | 'function_result';
  text: string;
  data?: any;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const useOfflineAssistant = (initialMessage: string, errorMessage: string) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initialize chat session
    if (isOnline) {
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            tools: [{ functionDeclarations }],
          },
        });
    }

    // Set the initial greeting message
    setMessages([{
      id: '1',
      role: 'model',
      text: initialMessage,
    }]);
  }, [initialMessage, isOnline]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage: Message = { id: `msg_${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMessage]);

    if (!isOnline) {
      const offlineResponseText = await getOfflineResponse(text, t);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now() + 1}`,
        role: 'model',
        text: offlineResponseText,
      }]);
      setIsLoading(false);
      return;
    }

    if (!chatRef.current) {
        console.error("Chat not initialized.");
        setIsLoading(false);
        return;
    };
    const chat = chatRef.current;

    try {
      const response = await chat.sendMessage({ message: text });
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          role: 'function_call',
          text: `Calling function: ${call.name}`,
          data: call.args,
        }]);

        let functionResponse;
        if (call.name === 'getCurrentWeather') {
          functionResponse = functionApi.getCurrentWeather(call.args.location as string);
        } else if (call.name === 'setLightBrightness') {
          functionResponse = functionApi.setLightBrightness(call.args.level as number, call.args.color as string | undefined);
        } else if (call.name === 'createReminder') {
          functionResponse = await functionApi.createReminder(call.args.title as string, call.args.delayInSeconds as number);
        } else if (call.name === 'translate') {
            functionResponse = functionApi.translate(call.args.text as string, call.args.targetLanguage as string);
        } else if (call.name === 'saveFavoriteArticle') {
            functionResponse = functionApi.saveFavoriteArticle(call.args.title as string, call.args.url as string);
        } else {
          throw new Error(`Unknown function call: ${call.name}`);
        }

        setMessages(prev => [...prev, {
          id: `msg_${Date.now() + 1}`,
          role: 'function_result',
          text: `Result for ${call.name}:`,
          data: functionResponse,
        }]);
        
        const functionResponsePart: Part[] = [{
          functionResponse: {
            name: call.name,
            response: functionResponse,
          }
        }];
        const finalResponse = await chat.sendMessage({ message: functionResponsePart });

        setMessages(prev => [...prev, {
          id: `msg_${Date.now() + 2}`,
          role: 'model',
          text: finalResponse.text,
        }]);

      } else {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          role: 'model',
          text: response.text,
        }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        role: 'model',
        text: errorMessage,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, errorMessage, isOnline, t]);

  return { messages, isLoading, sendMessage, isOnline };
};