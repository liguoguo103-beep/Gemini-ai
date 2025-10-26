import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chat } from '@google/genai';
import { createChat, ChatHistory, generateSpeech, generateChatTitle } from '../services/geminiService';
import { Icon } from './Icon';
import { decode, decodeAudioData } from '../utils/media';
import { useLanguage } from '../i18n/LanguageProvider';
import { ParsedApiError } from '../utils/error';

interface Message {
  id: string; // Add a unique ID for React keys and for the TTS playback tracking
  sender: 'user' | 'bot';
  text: string;
}

interface Conversation {
  id:string;
  title: string;
  history: Message[];
  systemInstruction: string;
}

// For SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
    abort: () => void;
  }
}

const langToSpeechRecLang: Record<string, string> = {
    'zh-TW': 'zh-TW',
    'en': 'en-US',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'hi': 'hi-IN',
    'ar': 'ar-SA',
};

interface ChatbotProps {
  activeProfileId: string;
  // FIX: Added onConversationsChange to props to allow parent component to sync with chat history.
  onConversationsChange: (updatedChats: Conversation[]) => void;
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-3.5">
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"></div>
    </div>
);

const MessageBubble = React.memo(({ msg, isLoading, isSpeechLoading, currentlySpeakingMessageId, handleSpeakerClick }: {
    msg: Message;
    isLoading: boolean;
    isSpeechLoading: string | null;
    currentlySpeakingMessageId: string | null;
    handleSpeakerClick: (msg: Message) => void;
}) => (
    <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end animate-slideInRight' : 'animate-slideInLeft'}`}>
        {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-base-800 flex-shrink-0 flex items-center justify-center shadow-lg border-2 border-primary/50"><Icon name="gemini" className="w-6 h-6" /></div>}
        <div className={`max-w-xl p-3.5 rounded-3xl shadow-md ${msg.sender === 'user' ? 'bg-gradient-primary text-white' : 'bg-white dark:bg-base-800 text-gray-800 dark:text-gray-200 border border-primary/20'}`}>
            <div className="text-sm whitespace-pre-wrap">
                {msg.text}
                {isLoading && msg.sender === 'bot' && !msg.text && <TypingIndicator />}
            </div>
            {msg.sender === 'bot' && msg.text && !isLoading && (
                <button onClick={() => handleSpeakerClick(msg)} className="mt-2 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                    {isSpeechLoading === msg.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Icon name="volume" className={`w-4 h-4 ${currentlySpeakingMessageId === msg.id ? 'text-primary' : ''}`} />
                    )}
                </button>
            )}
        </div>
    </div>
));


const Chatbot: React.FC<ChatbotProps> = ({ activeProfileId, onConversationsChange }) => {
  const { t, language } = useLanguage();

  const GEM_EXAMPLES = useMemo(() => t('gemExamples'), [t]);
  const DEFAULT_SYSTEM_INSTRUCTION = useMemo(() => GEM_EXAMPLES[0]?.prompt || 'You are a helpful AI.', [GEM_EXAMPLES]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editableSystemInstruction, setEditableSystemInstruction] = useState(DEFAULT_SYSTEM_INSTRUCTION);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState<string | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState<string | null>(null);
  const [isPersonaSettingsOpen, setIsPersonaSettingsOpen] = useState(false);
  const [personaUpdateStatus, setPersonaUpdateStatus] = useState('');
  const [isQuickResponse, setIsQuickResponse] = useState(false);

  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chatInstanceRef = useRef<Chat | null>(null);
  const isSendingRef = useRef(false);
  const hasSentFromRecordingRef = useRef(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.history ?? [];

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  const stopCurrentSpeech = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        console.warn("Could not stop audio source:", e);
      }
      audioSourceRef.current = null;
    }
    setCurrentlySpeakingMessageId(null);
    setIsSpeechLoading(null);
  }, []);

  const playTextAsSpeech = useCallback(async (text: string, messageId: string, lang: string) => {
    if (!text.trim()) return;
    stopCurrentSpeech();
    setIsSpeechLoading(messageId);
    try {
      const audioData = await generateSpeech(text, 'Kore', lang);
      if (audioData) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioCtx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(audioData), audioCtx, 24000, 1);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        setIsSpeechLoading(null);
        setCurrentlySpeakingMessageId(messageId);

        source.start();
        source.onended = () => {
          if (audioSourceRef.current === source) {
            audioSourceRef.current = null;
            setCurrentlySpeakingMessageId(null);
          }
        };
        audioSourceRef.current = source;
      }
    } catch (e: any) {
        console.error("Failed to generate or play speech:", e);
        stopCurrentSpeech();
        if (e instanceof ParsedApiError) {
            console.error(`TTS Error: ${t(e.key, e.params)}`);
        }
    }
  }, [stopCurrentSpeech, t]);

  useEffect(() => {
    if (activeConversation) {
      const chatHistoryForModel: ChatHistory[] = activeConversation.history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
      const modelToUse = isQuickResponse ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
      chatInstanceRef.current = createChat(chatHistoryForModel, activeConversation.systemInstruction, language, modelToUse);
      setEditableSystemInstruction(activeConversation.systemInstruction);
    }
  }, [activeConversation, language, isQuickResponse]);

  const sendMessage = useCallback(async (messageText: string, isVoiceInput: boolean) => {
    if (isSendingRef.current || !chatInstanceRef.current || !activeConversationId || !activeConversation) return;

    isSendingRef.current = true;
    setIsLoading(true);
    stopCurrentSpeech();

    // NOTE: File sending is not implemented in the service yet.
    // This is a UI-only implementation as requested.
    // We will clear the attachment after sending.
    if (attachedFile) {
        // In a real implementation, you would convert the file to base64
        // and send it along with the messageText.
        console.log("Sending message with attachment:", attachedFile.name);
        setAttachedFile(null);
        setAttachmentPreview(null);
    }


    const userMessage: Message = { id: `msg_${Date.now()}`, sender: 'user', text: messageText };
    const isFirstUserMessage = activeConversation.history.filter(m => m.sender === 'user').length === 0;
    const botMessagePlaceholder: Message = { id: `msg_${Date.now() + 1}`, sender: 'bot', text: '' };

    setConversations(prev => prev.map(c =>
        c.id === activeConversationId
            ? { ...c, history: [...c.history, userMessage, botMessagePlaceholder] }
            : c
    ));

    let botResponseText = '';
    try {
        const stream = await chatInstanceRef.current.sendMessageStream({ message: messageText });
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            botResponseText += chunkText;
            setConversations(prev => prev.map(conv => {
                if (conv.id === activeConversationId) {
                    const newHistory = [...conv.history];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage && lastMessage.id === botMessagePlaceholder.id) {
                      lastMessage.text = botResponseText;
                    }
                    return { ...conv, history: newHistory };
                }
                return conv;
            }));
        }

        if (isVoiceInput && botResponseText.trim()) {
            await playTextAsSpeech(botResponseText, botMessagePlaceholder.id, language);
        }

        if (isFirstUserMessage && activeConversation.history.length === 1) {
            const historyForTitle: ChatHistory[] = [
                { role: 'user', parts: [{ text: userMessage.text }] },
                { role: 'model', parts: [{ text: botResponseText }] },
            ];
            let newTitle = await generateChatTitle(historyForTitle, language);
            if (!newTitle) newTitle = t('newConversation');
            setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title: newTitle } : c));
        }

    } catch (e: any) {
        console.error('Chat error:', e);
        let errorMessage = t('errorMessage');
        if (e instanceof ParsedApiError) {
            errorMessage = t(e.key, e.params);
        }

        setConversations(prev => prev.map(c => {
            if (c.id === activeConversationId) {
                const newHistory = [...c.history];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage && lastMessage.id === botMessagePlaceholder.id) {
                    lastMessage.text = `⚠️ ${errorMessage}`;
                } else {
                    const errorHistory = newHistory.filter(msg => msg.id !== botMessagePlaceholder.id);
                    return { ...c, history: [...errorHistory, { id: botMessagePlaceholder.id, sender: 'bot', text: `⚠️ ${errorMessage}` }]};
                }
                return { ...c, history: newHistory };
            }
            return c;
        }));
    } finally {
        setIsLoading(false);
        isSendingRef.current = false;
    }
  }, [activeConversationId, activeConversation, stopCurrentSpeech, playTextAsSpeech, t, language, attachedFile]);

  const handleSendMessage = (isVoiceInput: boolean = false) => {
    if ((!input.trim() && !attachedFile) || isLoading) return;
    sendMessage(input, isVoiceInput);
    setInput('');
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  const createNewConversation = useCallback((instruction: string): Conversation => {
    return {
      id: Date.now().toString(),
      title: t('newConversation'),
      history: [{ id: `msg_${Date.now()}`, sender: 'bot', text: t('chatbotInitialMessage') }],
      systemInstruction: instruction
    };
  }, [t]);

  const handleStartNewConversation = useCallback(() => {
    stopCurrentSpeech();
    const newConv = createNewConversation(DEFAULT_SYSTEM_INSTRUCTION);
    // Add to the beginning of the list for better UX
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, [createNewConversation, DEFAULT_SYSTEM_INSTRUCTION, stopCurrentSpeech]);


  useEffect(() => {
    if (!activeProfileId) return;
    const conversationKey = `${activeProfileId}_conversations`;
    const lastActiveIdKey = `${activeProfileId}_lastActiveConversationId`;

    const savedConversationsJSON = localStorage.getItem(conversationKey);
    const lastActiveId = localStorage.getItem(lastActiveIdKey);
    let loadedConversations: Conversation[] = [];

    if (savedConversationsJSON && savedConversationsJSON !== '[]') {
      try {
        loadedConversations = JSON.parse(savedConversationsJSON);
      } catch (e) {
        console.error("Failed to parse conversations from localStorage", e);
        loadedConversations = [];
      }
    }

    if (loadedConversations.length === 0) {
      const newConv = createNewConversation(DEFAULT_SYSTEM_INSTRUCTION);
      setConversations([newConv]);
      setActiveConversationId(newConv.id);
    } else {
      setConversations(loadedConversations);
      setActiveConversationId(lastActiveId && loadedConversations.some(c => c.id === lastActiveId) ? lastActiveId : loadedConversations[0].id);
    }
  }, [activeProfileId, createNewConversation, DEFAULT_SYSTEM_INSTRUCTION]);

  useEffect(() => {
    if (!activeProfileId || conversations.length === 0) return;
    const conversationKey = `${activeProfileId}_conversations`;
    const lastActiveIdKey = `${activeProfileId}_lastActiveConversationId`;

    localStorage.setItem(conversationKey, JSON.stringify(conversations));
    if (activeConversationId) {
      localStorage.setItem(lastActiveIdKey, activeConversationId);
    }
    onConversationsChange(conversations);
  }, [conversations, activeConversationId, activeProfileId, onConversationsChange]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateCurrentChatPersona = () => {
    if (!activeConversationId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeConversationId
        ? { ...c, systemInstruction: editableSystemInstruction }
        : c
    ));
    setPersonaUpdateStatus(t('personaUpdatedSuccess'));
    setTimeout(() => setPersonaUpdateStatus(''), 3000);
  };

  const handleClearHistory = () => {
    if (!activeConversationId) return;
    setConversations(prev => prev.map(c =>
      c.id === activeConversationId
        ? { ...c, history: [{ id: `msg_${Date.now()}`, sender: 'bot', text: t('historyClearedMessage') }] }
        : c
    ));
    stopCurrentSpeech();
  };

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langToSpeechRecLang[language] || 'en-US';

      recognition.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        let interim_transcript = '';
        let final_transcript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }

        if (final_transcript) {
            setInput(prev => prev + final_transcript);
        }

        silenceTimerRef.current = window.setTimeout(() => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }, 1500);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (!hasSentFromRecordingRef.current) {
          hasSentFromRecordingRef.current = true;
          handleSendMessageRef.current(true);
        }
      };
      recognitionRef.current = recognition;
    }
    return () => {
      recognitionRef.current?.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech, language]);

  const toggleRecording = () => {
    if (!recognitionRef.current || isLoading) return;
    stopCurrentSpeech();
    if (isRecording) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current.stop();
    } else {
      hasSentFromRecordingRef.current = false;
      setInput('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopCurrentSpeech();
    setInput(e.target.value);
  }

  const handleSpeakerClick = useCallback((message: Message) => {
    if (currentlySpeakingMessageId === message.id) {
        stopCurrentSpeech();
    } else {
        playTextAsSpeech(message.text, message.id, language);
    }
  }, [currentlySpeakingMessageId, stopCurrentSpeech, playTextAsSpeech, language]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
    // Reset file input value to allow selecting the same file again
    event.target.value = '';
    setShowUploadMenu(false);
  };


  return (
    <div className="flex w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl relative overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      <input type="file" accept="image/*" ref={photoInputRef} onChange={handleFileSelect} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" />

      {/* Main Chat Panel */}
      <div className="flex flex-col flex-1 relative min-w-0 overflow-hidden">
        <div className="p-4 border-b border-primary/10 dark:border-base-700/50 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <h2 className="text-xl font-bold text-gradient truncate">{activeConversation?.title || t('chatbotTitle')}</h2>
              <button
                  onClick={handleStartNewConversation}
                  className="flex items-center gap-2 text-sm bg-gradient-primary text-white font-semibold py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-95 hover:animate-liftUp hover:shadow-glow-primary flex-shrink-0"
              >
                  <Icon name="plus" className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('newConversation')}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleClearHistory}
                    className="text-xs bg-gray-200/50 dark:bg-base-700/50 hover:bg-gray-300/50 dark:hover:bg-base-600/50 text-gray-700 dark:text-gray-300 font-semibold py-1 px-3 rounded-2xl transition-all duration-300 active:scale-95 hover:animate-liftUp"
                >
                    {t('clearMemory')}
                </button>
            </div>
        </div>

        <div className="p-4 border-b border-primary/10 dark:border-base-700/50 flex-shrink-0">
           <button onClick={() => setIsPersonaSettingsOpen(!isPersonaSettingsOpen)} className="w-full flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
                <span className='text-gradient font-semibold'>{t('customAIPersona')}</span>
                <span className="text-xs font-normal bg-gray-200 dark:bg-base-700 px-2 py-0.5 rounded-full">
                    {isQuickResponse ? 'Gemini 2.5 Flash Lite' : 'Gemini 2.5 Flash'}
                </span>
            </div>
            <Icon name={isPersonaSettingsOpen ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 transition-transform duration-300" />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ease-modern ${isPersonaSettingsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4 pt-2">
              <textarea
                id="system-instruction"
                rows={3}
                value={editableSystemInstruction}
                onChange={(e) => setEditableSystemInstruction(e.target.value)}
                className="w-full bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/80 text-sm transition-shadow focus:animate-softGlowRing"
                placeholder={t('personaPlaceholder')}
              />
              <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('tryExamples')}</p>
                  <div className="flex flex-wrap gap-2">
                      {GEM_EXAMPLES.map((example: any) => (
                          <button
                              key={example.title}
                              onClick={() => setEditableSystemInstruction(example.prompt)}
                              className="text-xs bg-gray-200 dark:bg-base-700 hover:bg-gray-300 dark:hover:bg-base-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-full transition-all duration-300 active:scale-95 hover:animate-liftUp"
                          >
                              {example.title}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-base-700/50">
                  <div className="flex flex-col">
                      <label htmlFor="quick-response-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          {t('quickResponseMode')}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{t('quickResponseDesc')}</p>
                  </div>
                  <button
                      id="quick-response-toggle"
                      role="switch"
                      aria-checked={isQuickResponse}
                      onClick={() => setIsQuickResponse(!isQuickResponse)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-base-900 ${isQuickResponse ? 'bg-gradient-primary' : 'bg-gray-300 dark:bg-base-700'}`}
                  >
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isQuickResponse ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>
              <button
                onClick={handleUpdateCurrentChatPersona}
                className="w-full bg-gradient-primary text-white font-semibold py-2 px-3 rounded-2xl transition-all duration-300 transform active:scale-95 hover:animate-liftUp hover:shadow-lg hover:shadow-primary/40"
              >
                {t('updateCurrentChatPersona')}
              </button>
              {personaUpdateStatus && (
                <p className="text-xs text-green-500 dark:text-green-400 text-center pt-1 animate-fadeIn">
                  {personaUpdateStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
             <MessageBubble
                key={msg.id}
                msg={msg}
                isLoading={isLoading}
                isSpeechLoading={isSpeechLoading}
                currentlySpeakingMessageId={currentlySpeakingMessageId}
                handleSpeakerClick={handleSpeakerClick}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-primary/10 dark:border-base-700/50 flex-shrink-0 relative">
          {showUploadMenu && (
            <div
              className="absolute bottom-full left-4 mb-2 w-60 bg-white/80 dark:bg-base-800/80 backdrop-blur-md border border-primary/20 rounded-3xl shadow-2xl z-10 animate-slideInUp-fast"
              onMouseLeave={() => setShowUploadMenu(false)}
            >
              <button onClick={() => photoInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 text-sm hover:bg-gray-100 dark:hover:bg-base-700 rounded-t-3xl">
                <Icon name="image" className="w-5 h-5 text-gray-600 dark:text-gray-300"/> <span>上傳照片</span>
              </button>
              <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 text-sm hover:bg-gray-100 dark:hover:bg-base-700">
                <Icon name="video" className="w-5 h-5 text-gray-600 dark:text-gray-300"/> <span>拍照</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 text-sm hover:bg-gray-100 dark:hover:bg-base-700 rounded-b-3xl">
                <Icon name="cube" className="w-5 h-5 text-gray-600 dark:text-gray-300"/> <span>上傳檔案</span>
              </button>
            </div>
          )}
          {attachedFile && (
            <div className="px-2 pb-2 animate-fadeIn">
                <div className="relative inline-block bg-gray-200 dark:bg-base-700 p-2 rounded-2xl">
                    {attachmentPreview ? (
                        <img src={attachmentPreview} alt="Preview" className="max-h-24 rounded-lg" />
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                           <Icon name="cube" className="w-5 h-5" />
                           <span>{attachedFile.name}</span>
                        </div>
                    )}
                    <button onClick={() => { setAttachedFile(null); setAttachmentPreview(null); }} className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                </div>
            </div>
          )}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/80 transition-shadow duration-200 focus-within:animate-softGlowRing">
            <button
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="p-2 rounded-full transition-transform duration-300 active:scale-90 hover:animate-liftUp bg-gradient-primary text-white hover:opacity-90"
                aria-label="Upload file"
            >
                <Icon name="plus" className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(false)}
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none px-2"
              disabled={isLoading}
            />
            {speechRecognitionSupported && (
              <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`p-2 rounded-full transition-all duration-300 active:scale-90 hover:animate-liftUp ${
                  isRecording
                      ? 'bg-gradient-primary text-white animate-breathing'
                      : 'bg-gray-200 dark:bg-base-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-base-600'
                  } disabled:bg-gray-100 dark:disabled:bg-base-800 disabled:cursor-not-allowed`}
                  aria-label={isRecording ? t('stopRecording') : t('startRecording')}
              >
                  <Icon name="mic" className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => handleSendMessage(false)}
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="bg-gradient-primary text-white px-4 py-2 rounded-xl disabled:from-gray-300 disabled:to-gray-200 dark:disabled:from-base-700 dark:disabled:to-base-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 active:scale-95 hover:animate-liftUp"
            >
              {isLoading ? t('sendingMessage') : t('sendMessage')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;