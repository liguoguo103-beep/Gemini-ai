import React, { useState, useRef, useEffect } from 'react';
import { Icon, ICONS } from './Icon';
import { useLanguage } from '../i18n/LanguageProvider';
import { useOfflineAssistant, Message } from '../hooks/useFunctionCalling';

interface FunctionInfo {
    icon: keyof typeof ICONS;
    title: string;
    desc: string;
    example: string;
}

const OfflineAssistant: React.FC = () => {
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const { messages, isLoading, sendMessage, isOnline } = useOfflineAssistant(
        t('offlineAssistantInitialMessage'),
        t('errorMessage')
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput('');
    };
    
    const handleCardClick = (example: string) => {
        setInput(example);
        inputRef.current?.focus();
    };

    const FunctionCard: React.FC<FunctionInfo & { disabled: boolean }> = ({ icon, title, desc, example, disabled }) => (
        <button
            onClick={() => handleCardClick(example)}
            disabled={disabled}
            className="flex items-start text-left gap-4 p-4 bg-primary/5 dark:bg-primary/10 border border-transparent dark:border-primary/20 rounded-2xl transition-all duration-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:shadow-glow-primary hover:border-primary/50 hover:animate-liftUp disabled:opacity-40 disabled:pointer-events-none disabled:filter disabled:grayscale"
        >
            <div className="p-2 bg-gradient-primary rounded-xl bg-400% animate-gradient-pan">
                <Icon name={icon} className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
            </div>
        </button>
    );

    const onlineFunctions: FunctionInfo[] = [
        { icon: 'sun', title: t('funcWeatherTitle'), desc: t('funcWeatherDesc'), example: t('funcWeatherExample') },
        { icon: 'lightbulb', title: t('funcLightTitle'), desc: t('funcLightDesc'), example: t('funcLightExample') },
        { icon: 'globe', title: t('funcTranslateTitle'), desc: t('funcTranslateDesc'), example: t('funcTranslateExample') },
        { icon: 'bookmark', title: t('funcSaveArticleTitle'), desc: t('funcSaveArticleDesc'), example: t('funcSaveArticleExample') },
    ];
    const offlineFunctions: FunctionInfo[] = [
        { icon: 'history', title: t('funcReminderTitle'), desc: t('funcReminderDesc'), example: t('funcReminderExample') },
        { icon: 'chat', title: t('funcChatTitle'), desc: t('funcChatDesc'), example: t('funcChatExample') },
        { icon: 'calculator', title: t('funcCalcTitle'), desc: t('funcCalcDesc'), example: t('funcCalcExample') },
    ];

    const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
        const animationClass = msg.role === 'user' ? 'animate-slideInRight' : 'animate-slideInLeft';

        switch (msg.role) {
            case 'user':
                return (
                    <div className={`flex justify-end ${animationClass}`}>
                        <div className="max-w-xl p-3.5 rounded-3xl bg-gradient-primary text-white shadow-md">
                            <p>{msg.text}</p>
                        </div>
                    </div>
                );
            case 'model':
                return (
                    <div className={`flex items-start gap-3 ${animationClass}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-base-800 flex-shrink-0 flex items-center justify-center shadow-lg border-2 border-primary/50"><Icon name="gemini" className="w-6 h-6" /></div>
                        <div className="max-w-xl p-3.5 rounded-3xl bg-white dark:bg-base-800 text-gray-800 dark:text-gray-200">
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                );
            case 'function_call':
                return (
                    <div className={`flex items-start gap-3 ${animationClass}`}>
                        <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center shadow-lg"><Icon name="cog" className="w-5 h-5 text-white" /></div>
                        <div className="max-w-xl p-3.5 rounded-3xl bg-white dark:bg-base-800 text-gray-800 dark:text-gray-200 border border-secondary/50">
                            <p className="font-bold text-secondary">{t('functionCall')}</p>
                            <p className="text-sm mt-1">{msg.text}</p>
                            <pre className="mt-2 text-xs bg-gray-200 dark:bg-base-900/50 p-2 rounded-2xl overflow-x-auto"><code>{JSON.stringify(msg.data, null, 2)}</code></pre>
                        </div>
                    </div>
                );
            case 'function_result':
                return (
                    <div className={`flex items-start gap-3 ${animationClass}`}>
                        <div className="w-8 h-8 rounded-full bg-accent/80 flex-shrink-0 flex items-center justify-center shadow-lg"><Icon name="check" className="w-5 h-5 text-white" /></div>
                        <div className="max-w-xl p-3.5 rounded-3xl bg-white dark:bg-base-800 text-gray-800 dark:text-gray-200 border border-accent/50">
                            <p className="font-bold text-accent">{t('functionResult')}</p>
                            <p className="text-sm mt-1">{msg.text}</p>
                            <pre className="mt-2 text-xs bg-gray-200 dark:bg-base-900/50 p-2 rounded-2xl overflow-x-auto"><code>{JSON.stringify(msg.data, null, 2)}</code></pre>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col w-full h-full bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border border-primary/20 rounded-4xl shadow-2xl p-6">
            <div className="flex-shrink-0">
                <h2 className="text-3xl font-bold text-gradient mb-1">{t('offlineAssistantTitle')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('offlineAssistantDesc')}</p>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5 p-2 bg-gray-100 dark:bg-base-800/50 rounded-full self-start">
                        <span className={`w-3 h-3 rounded-full transition-colors ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{isOnline ? t('offline_status_online') : t('offline_status_offline')}</span>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('whatICanDo')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...offlineFunctions, ...onlineFunctions].map(fn => (
                            <FunctionCard 
                                key={fn.title}
                                {...fn}
                                disabled={!isOnline && onlineFunctions.some(onlineFn => onlineFn.title === fn.title)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1 gap-4 overflow-hidden border-t border-primary/20 dark:border-base-700 mt-6 pt-4">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-100 dark:bg-base-950/50 rounded-3xl">
                    {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                    {isLoading && <div className="text-center text-gray-500 dark:text-gray-400">{t('thinking')}...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-base-800/50 border border-gray-300 dark:border-base-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/80 transition-shadow duration-200 focus-within:animate-softGlowRing">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('offlineAssistantPlaceholder')}
                        className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none px-2"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-primary text-white font-bold py-2 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 active:scale-95 hover:animate-liftUp"
                    >
                        {t('sendMessage')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfflineAssistant;