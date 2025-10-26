import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tab, BeforeInstallPromptEvent } from './types';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import MediaEditorAnalyzer from './components/MediaEditorAnalyzer';
import OfflineAssistant from './components/FunctionCalling';
import LiveConversation from './components/LiveConversation';
import GroundedSearch from './components/GroundedSearch';
import ComplexReasoning from './components/ComplexReasoning';
import TextToSpeech from './components/TextToSpeech';
// FIX: Changed to a named import for CodeGenerator as it is not a default export.
import CodeGenerator from './components/CodeGenerator';
import { Icon, ICONS } from './components/Icon';
// FIX: Added 'getAllMedia' to the import list from './utils/db'.
import { addProfile, getAllProfiles, deleteProfile, updateProfile, Profile, MediaRecord, IMAGE_STORE, VIDEO_STORE, CodeRecord, CODE_STORE, getAllCode, getAllMedia, deleteMedia } from './utils/db';
import { useLanguage } from './i18n/LanguageProvider';
import { useTheme } from './context/ThemeContext';

type HistoryData = {
  chats: any[];
  images: MediaRecord[];
  videos: MediaRecord[];
  code: CodeRecord[];
};

type HistoryTab = 'chats' | 'images' | 'videos' | 'code';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATBOT);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState('');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const { theme, setTheme, primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor } = useTheme();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>('chats');
  const [historyData, setHistoryData] = useState<HistoryData>({ chats: [], images: [], videos: [], code: [] });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [chatbotKey, setChatbotKey] = useState(0);
  const [showInstallHint, setShowInstallHint] = useState(false);


  useEffect(() => {
    document.title = t('appName');
  }, [t]);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsPWAInstalled(isStandalone);
      if (isStandalone) {
        setShowInstallHint(false); // Don't show hint if already installed
      }
    };
    checkInstalled();
    window.addEventListener('appinstalled', checkInstalled);
    return () => window.removeEventListener('appinstalled', checkInstalled);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
        const hintShown = localStorage.getItem('installHintShown');
        // Use a function to get the latest state value
        setIsPWAInstalled(isInstalled => {
            if (!hintShown && !isInstalled) {
                setShowInstallHint(true);
            }
            return isInstalled;
        });
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      let savedProfiles = await getAllProfiles();
      if (savedProfiles.length === 0) {
        const defaultProfile: Profile = {
          id: `profile_${Date.now()}`,
          name: `${t('defaultProfileName')} 1`,
          createdAt: new Date(),
        };
        await addProfile(defaultProfile);
        savedProfiles = [defaultProfile];
      }
      setProfiles(savedProfiles);

      const lastActiveId = localStorage.getItem('lastActiveProfileId');
      if (lastActiveId && savedProfiles.some(p => p.id === lastActiveId)) {
        setActiveProfileId(lastActiveId);
      } else {
        setActiveProfileId(savedProfiles[0].id);
      }
    };
    loadProfiles();
  }, [t]);

  const loadHistoryData = useCallback(async (profileId: string) => {
    const chatKey = `${profileId}_conversations`;
    const savedChats = JSON.parse(localStorage.getItem(chatKey) || '[]');
    // FIX: Corrected missing 'getAllMedia' function call. It was not imported.
    const images = await getAllMedia(IMAGE_STORE, profileId);
    const videos = await getAllMedia(VIDEO_STORE, profileId);
    const code = await getAllCode(profileId);
    setHistoryData({ chats: savedChats, images, videos, code });
  }, []);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem('lastActiveProfileId', activeProfileId);
      loadHistoryData(activeProfileId);
    }
  }, [activeProfileId, loadHistoryData]);

  useEffect(() => {
    if (isNavCollapsed) {
        setShowSettingsPopup(false);
    }
  }, [isNavCollapsed]);

  const handleHistoryChange = useCallback(() => {
    if (activeProfileId) {
        loadHistoryData(activeProfileId);
    }
  }, [activeProfileId, loadHistoryData]);
  
  const handleConfirmAddProfile = async () => {
    if (newProfileName.trim()) {
      const newProfile: Profile = {
        id: `profile_${Date.now()}`,
        name: newProfileName.trim(),
        createdAt: new Date(),
      };
      await addProfile(newProfile);
      const updatedProfiles = await getAllProfiles();
      setProfiles(updatedProfiles);
      setActiveProfileId(newProfile.id);
    }
    setIsAddingProfile(false);
    setNewProfileName('');
  };
  
  const handleStartRename = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setEditingProfileName(profile.name);
  };
  
  const handleRenameProfile = async () => {
    if (!editingProfileId || !editingProfileName.trim()) {
        setEditingProfileId(null);
        return;
    }
    const profileToUpdate = profiles.find(p => p.id === editingProfileId);
    if (profileToUpdate) {
        const updatedProfile = { ...profileToUpdate, name: editingProfileName.trim() };
        await updateProfile(updatedProfile);
        setProfiles(profiles.map(p => p.id === editingProfileId ? updatedProfile : p));
    }
    setEditingProfileId(null);
  };


  const handleDeleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      alert(t('deleteProfileError'));
      return;
    }
    if (confirm(t('deleteProfileConfirm'))) {
      await deleteProfile(profileId);
      const updatedProfiles = await getAllProfiles();
      setProfiles(updatedProfiles);
      if (activeProfileId === profileId) {
        setActiveProfileId(updatedProfiles[0]?.id || null);
      }
    }
  };
  
  const handleSelectChat = (conversationId: string) => {
    if (activeProfileId) {
      localStorage.setItem(`${activeProfileId}_lastActiveConversationId`, conversationId);
      setActiveTab(Tab.CHATBOT);
      setIsHistoryPanelOpen(false);
      // Force Chatbot to re-mount and read from local storage by updating its key
      setChatbotKey(prevKey => prevKey + 1);
    }
  };

  const handleDeleteHistoryItem = async (type: HistoryTab, id: number | string) => {
     if (!activeProfileId || !confirm(t('deleteHistoryItemConfirm'))) return;
     
     try {
       if (type === 'images') {
         await deleteMedia(IMAGE_STORE, id as number);
       } else if (type === 'videos') {
         await deleteMedia(VIDEO_STORE, id as number);
       } else if (type === 'code') {
         await deleteMedia(CODE_STORE, id as number);
       } else if (type === 'chats') {
         const chatKey = `${activeProfileId}_conversations`;
         const updatedChats = historyData.chats.filter(c => c.id !== id);
         localStorage.setItem(chatKey, JSON.stringify(updatedChats));
       }
       loadHistoryData(activeProfileId);
     } catch(e) {
       console.error("Failed to delete history item:", e);
     }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsPWAInstalled(true);
        setShowInstallHint(false);
    } else {
        console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null);
  };

  const handleDismissHint = () => {
    setShowInstallHint(false);
    localStorage.setItem('installHintShown', 'true');
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const renderContent = () => {
    if (!activeProfileId) {
        return <div className="text-center text-gray-500 dark:text-gray-400">{t('loadingProfile')}</div>;
    }
    const contentMap: Record<Tab, React.ReactElement> = {
      [Tab.CHATBOT]: <Chatbot 
          activeProfileId={activeProfileId} 
          onConversationsChange={(updatedChats) => {
            setHistoryData(prev => ({...prev, chats: updatedChats }));
          }}
        />,
      [Tab.IMAGE_GEN]: <ImageGenerator activeProfileId={activeProfileId} onHistoryChange={handleHistoryChange} />,
      [Tab.VIDEO_GEN]: <VideoGenerator activeProfileId={activeProfileId} onHistoryChange={handleHistoryChange} />,
      [Tab.MEDIA_EDITOR]: <MediaEditorAnalyzer />,
      [Tab.OFFLINE_ASSISTANT]: <OfflineAssistant />,
      [Tab.LIVE]: <LiveConversation />,
      [Tab.GROUNDING]: <GroundedSearch />,
      [Tab.REASONING]: <ComplexReasoning />,
      [Tab.TTS]: <TextToSpeech />,
      [Tab.CODE_GEN]: <CodeGenerator activeProfileId={activeProfileId} onHistoryChange={handleHistoryChange} />,
    };
    return contentMap[activeTab] || null;
  };
  
  const NavItem: React.FC<{ tab: Tab; icon: keyof typeof ICONS }> = ({ tab, icon }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        if (isMobile) setIsMobileNavOpen(false);
      }}
      className={`relative flex items-center p-3 w-full text-left text-sm font-medium rounded-2xl transition-all duration-300 ease-modern group hover:z-10 hover:animate-liftUp ${
        activeTab === tab
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-base-700/50 hover:text-gray-900 dark:hover:text-white'
      } ${isNavCollapsed ? 'justify-center' : 'space-x-3'}`}
    >
      {activeTab === tab && (
         <span className="absolute inset-0 bg-gradient-primary rounded-2xl border border-primary/50 shadow-glow-primary transition-all duration-300 animate-gradient-pan bg-400%"></span>
      )}
      <Icon name={icon} className="w-5 h-5 z-10 transition-transform duration-300" />
      <span className={`z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${isNavCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t(`tab_${tab}`)}</span>
    </button>
  );

  const navItems = [
    { tab: Tab.CHATBOT, icon: 'chat' as const },
    { tab: Tab.IMAGE_GEN, icon: 'image' as const },
    { tab: Tab.VIDEO_GEN, icon: 'video' as const },
    { tab: Tab.MEDIA_EDITOR, icon: 'edit' as const },
    { tab: Tab.OFFLINE_ASSISTANT, icon: 'shield-check' as const },
    { tab: Tab.LIVE, icon: 'mic' as const },
    { tab: Tab.GROUNDING, icon: 'search' as const },
    { tab: Tab.REASONING, icon: 'sparkles' as const },
    { tab: Tab.TTS, icon: 'volume' as const },
    { tab: Tab.CODE_GEN, icon: 'cube' as const },
  ];
  
  const SettingsPopup = () => (
    <div 
        className="absolute bottom-20 left-4 w-64 bg-white/80 dark:bg-base-900/80 backdrop-blur-md border border-primary/20 rounded-3xl shadow-2xl z-10 animate-scaleIn"
        style={{ transformOrigin: 'bottom left' }}
        onClick={(e) => e.stopPropagation()}
    >
        {/* Profile Management */}
        <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-2 border-b border-gray-200 dark:border-base-700">{t('manageProfiles')}</div>
            <div className="max-h-40 overflow-y-auto my-1 pr-1">
            {profiles.map(profile => (
              <div key={profile.id} className="group flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-base-800 rounded-xl transition-colors duration-200">
                 {editingProfileId === profile.id ? (
                    <input
                        type="text"
                        value={editingProfileName}
                        onChange={(e) => setEditingProfileName(e.target.value)}
                        onBlur={handleRenameProfile}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameProfile()}
                        className="bg-gray-200 dark:bg-base-700 text-gray-900 dark:text-white text-sm p-1 w-full rounded-md focus:ring-2 focus:ring-primary animate-fadeIn"
                        autoFocus
                    />
                 ) : (
                    <>
                        <button onClick={() => { setActiveProfileId(profile.id); setShowSettingsPopup(false); }} className={`text-sm text-left flex-1 truncate pr-2 transition-colors duration-200 ${profile.id === activeProfileId ? 'text-gradient font-bold' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                            {profile.name}
                        </button>
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => handleStartRename(profile)} className="p-1" aria-label={t('renameProfile')}>
                                <Icon name="pencil" className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"/>
                            </button>
                            {profile.id !== activeProfileId && (
                                <button onClick={() => handleDeleteProfile(profile.id)} className="p-1" aria-label={t('deleteConversation')}>
                                    <Icon name="trash" className="w-4 h-4 text-accent/80 hover:text-accent transition-colors"/>
                                </button>
                            )}
                        </div>
                    </>
                 )}
              </div>
            ))}
            </div>
            {isAddingProfile ? (
              <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-200 dark:border-base-700 animate-fadeIn">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddProfile()}
                  placeholder={t('addProfilePrompt')}
                  className="bg-gray-200 dark:bg-base-700 text-gray-900 dark:text-white text-sm p-1 w-full rounded-md focus:ring-2 focus:ring-primary"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
                <button onClick={handleConfirmAddProfile} className="p-1.5 bg-gradient-primary rounded-full hover:opacity-90 transition-opacity active:scale-90 flex-shrink-0" aria-label="Confirm add profile">
                  <Icon name="check" className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => { setIsAddingProfile(false); setNewProfileName(''); }} className="p-1.5 bg-gray-300 dark:bg-base-700 rounded-full hover:bg-gray-400 dark:hover:bg-base-600 transition-colors active:scale-90 flex-shrink-0" aria-label="Cancel add profile">
                  <Icon name="close" className="w-4 h-4 text-gray-800 dark:text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => {
                  setIsAddingProfile(true);
                  setNewProfileName(`${t('defaultProfileName')} ${profiles.length + 1}`);
                }}
                className="w-full text-sm text-center p-2 mt-1 border-t border-gray-200 dark:border-base-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-base-800 hover:text-gray-900 dark:hover:text-white rounded-b-xl transition-all duration-300 active:scale-95"
              >
                  {t('addProfile')}
              </button>
            )}
        </div>
        {/* Install App Section */}
        <div className="p-2 border-t border-gray-200 dark:border-base-700">
            {isPWAInstalled ? (
                <div className="flex items-center gap-3 p-3 text-sm text-gray-600 dark:text-gray-300">
                    <Icon name="check" className="w-5 h-5 text-green-500" />
                    <span>{t('appAlreadyInstalled')}</span>
                </div>
            ) : installPrompt ? (
                <button 
                    onClick={handleInstallClick}
                    className="w-full flex items-center gap-3 p-3 text-sm text-left font-medium rounded-xl transition-all duration-300 ease-modern group bg-gradient-primary text-white hover:opacity-90 active:scale-95 hover:animate-liftUp"
                >
                    <Icon name="download" className="w-5 h-5" />
                    <span>{t('installApp')}</span>
                </button>
            ) : (
                <div className="p-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                    {t('manualInstallPrompt')}
                </div>
            )}
        </div>
        {/* Language Selector */}
        <div className="p-2 border-t border-gray-200 dark:border-base-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-2 pb-2">
                <Icon name="globe" className="w-4 h-4" />
                <span>{t('languageSettings')}</span>
            </div>
            <div className="max-h-32 overflow-y-auto pr-1">
            {supportedLanguages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); }}
                    className={`w-full text-left text-sm p-2 rounded-xl transition-all duration-200 ${language === lang.code ? 'bg-gradient-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-base-800'}`}
                >
                    {lang.name}
                </button>
            ))}
            </div>
        </div>
        {/* Theme Toggler */}
        <div className="p-3 border-t border-gray-200 dark:border-base-700 space-y-3">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="w-4 h-4" />
                    <span>{t('theme')}</span>
                </div>
                 <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-300 dark:bg-base-700"
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('themeColors')}</div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-7 h-7 bg-transparent rounded-md border-none cursor-pointer p-0" />
                        <span className="text-sm">{t('primaryColor')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-7 h-7 bg-transparent rounded-md border-none cursor-pointer p-0" />
                        <span className="text-sm">{t('secondaryColor')}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const InstallHintModal = () => (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleDismissHint}
    >
      <div 
        className="bg-white dark:bg-base-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center border border-primary/20 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <Icon name="download" className="w-10 h-10 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('installHintTitle')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('installHintBody') }} />
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-xl mb-6" dangerouslySetInnerHTML={{ __html: t('installHintWarning') }} />
        <button
          onClick={handleDismissHint}
          className="w-full bg-gradient-primary text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity active:scale-95"
        >
          {t('installHintDismiss')}
        </button>
      </div>
    </div>
  );

  const renderHistoryContent = () => {
    const data = historyData[historyTab];
    if (data.length === 0) {
      return <div className="text-center text-sm text-gray-500 p-4">{t('noHistory')}</div>;
    }

    switch (historyTab) {
      case 'chats':
        return data.map((chat: any) => (
          <div key={chat.id} className="group relative flex items-center justify-between p-2 hover:bg-gray-200/50 dark:hover:bg-base-700/50 rounded-lg transition-all duration-300 hover:animate-liftUp hover:shadow-glow-primary">
            <button onClick={() => handleSelectChat(chat.id)} className="text-sm text-left flex-1 truncate pr-2 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{chat.title}</button>
            <button onClick={() => handleDeleteHistoryItem('chats', chat.id)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-4 h-4 text-accent/80 hover:text-accent"/></button>
          </div>
        ));
      case 'images':
        // FIX: Added type assertion to resolve TypeScript error with union types.
        return <div className="grid grid-cols-2 gap-2">{(data as MediaRecord[]).map((item) => (
          <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-base-800">
            <img src={URL.createObjectURL(item.blob)} alt={item.prompt} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex flex-col justify-end">
              <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
              <button onClick={() => handleDeleteHistoryItem('images', item.id!)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"><Icon name="trash" className="w-3 h-3 text-white"/></button>
            </div>
          </div>
        ))}</div>;
      case 'videos':
        // FIX: Added type assertion to resolve TypeScript error with union types.
        return <div className="grid grid-cols-2 gap-2">{(data as MediaRecord[]).map((item) => (
          <div key={item.id} className="group relative aspect-video rounded-lg overflow-hidden bg-gray-800">
            <video src={URL.createObjectURL(item.blob)} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex flex-col justify-end">
              <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
              <button onClick={() => handleDeleteHistoryItem('videos', item.id!)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"><Icon name="trash" className="w-3 h-3 text-white"/></button>
            </div>
          </div>
        ))}</div>;
       case 'code':
        // FIX: Added type assertion to resolve TypeScript error with union types.
        return (data as CodeRecord[]).map((item) => (
          <div key={item.id} className="group relative p-2 hover:bg-gray-200/50 dark:hover:bg-base-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-all duration-300 hover:animate-liftUp hover:shadow-glow-primary">
            <p className="font-mono text-xs mb-1 bg-gray-100 dark:bg-base-800/50 rounded px-1 self-start inline-block">{item.language}</p>
            <p className="truncate">{item.prompt}</p>
            <button onClick={() => handleDeleteHistoryItem('code', item.id!)} className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-4 h-4 text-accent/80 hover:text-accent"/></button>
          </div>
        ));
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-base-950 text-gray-900 dark:text-gray-200 font-sans bg-grid animated-bg">
      {isMobileNavOpen && <div onClick={() => setIsMobileNavOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden" />}
      {showInstallHint && <InstallHintModal />}
      
      {/* Navigation Sidebar */}
      <nav className={`fixed lg:relative inset-y-0 left-0 bg-white/60 dark:bg-base-900/60 backdrop-blur-lg border-r border-white/20 dark:border-base-700/50 p-4 flex flex-col justify-between transform transition-all duration-300 ease-modern z-40 lg:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} ${isNavCollapsed ? 'w-24' : 'w-64'}`}>
        <div>
            <div className={`flex items-center p-3 mb-2 transition-all duration-500 ${isNavCollapsed ? 'justify-center' : ''}`}>
                <Icon name="gemini" className="w-7 h-7 flex-shrink-0" />
                <h1 className={`text-xl font-bold text-gradient overflow-hidden whitespace-nowrap transition-all duration-300 ${isNavCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}`}>{t('appName')}</h1>
            </div>
             {/* History Panel */}
            <button
              onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)}
              className={`relative flex items-center p-3 w-full text-left text-sm font-medium rounded-2xl transition-all duration-300 ease-modern group mb-2 hover:animate-liftUp bg-gray-100/50 dark:bg-base-800/50 hover:bg-gray-200 dark:hover:bg-base-800 ${isNavCollapsed ? 'justify-center' : 'space-x-3'}`}
            >
              <Icon name="history" className="w-5 h-5 z-10 text-gray-600 dark:text-gray-300" />
              <span className={`z-10 transition-all duration-300 whitespace-nowrap overflow-hidden text-gray-700 dark:text-gray-200 ${isNavCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t('historyPanelTitle')}</span>
              <Icon name={isHistoryPanelOpen ? 'chevron-up' : 'chevron-down'} className={`w-5 h-5 z-10 transition-all duration-300 text-gray-500 dark:text-gray-400 ${isNavCollapsed ? 'hidden' : 'ml-auto'}`}/>
            </button>
            <div className={`grid transition-all duration-500 ease-modern ${isHistoryPanelOpen && !isNavCollapsed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden bg-gray-100/30 dark:bg-base-800/20 rounded-2xl mb-2">
                <div className="p-2 space-y-1">
                  <div className="flex bg-gray-200/50 dark:bg-base-800/50 rounded-lg p-1 text-xs">
                    {(['chats', 'images', 'videos', 'code'] as HistoryTab[]).map(tab => (
                      <button key={tab} onClick={() => setHistoryTab(tab)} className={`flex-1 p-1 rounded-md transition-colors ${historyTab === tab ? 'bg-white dark:bg-base-700 shadow-sm' : 'hover:bg-gray-200/50 dark:hover:bg-base-700/50'}`}>{t(`history${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}</button>
                    ))}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                    {renderHistoryContent()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {navItems.map((item, index) => (
                <div key={item.tab} className="animate-slideInLeft" style={{ animationDelay: `${100 + index * 40}ms`, animationFillMode: 'backwards' }}>
                  <NavItem tab={item.tab} icon={item.icon} />
                </div>
              ))}
            </div>
        </div>

        {/* Bottom Section: Profile, Collapse, and Settings */}
        <div className="space-y-2">
            <div className="hidden lg:block">
              <button
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className={`flex items-center p-3 w-full text-left text-sm font-medium rounded-2xl transition-all duration-300 ease-modern group text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-base-700/50 hover:text-gray-900 dark:hover:text-white hover:animate-liftUp ${isNavCollapsed ? 'justify-center' : 'space-x-3'}`}
                aria-label={isNavCollapsed ? t('expandSidebar') : t('collapseSidebar')}
              >
                <Icon name={isNavCollapsed ? 'chevron-right' : 'chevron-left'} className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isNavCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t('collapseSidebar')}</span>
              </button>
            </div>
            <div className="relative">
                {showSettingsPopup && <SettingsPopup />}
                 <button
                    onClick={() => setShowSettingsPopup(!showSettingsPopup)}
                    className={`relative flex items-center p-3 w-full text-left text-sm font-medium rounded-2xl transition-all duration-300 ease-modern group bg-gray-100/50 dark:bg-base-800/50 hover:bg-gray-200 dark:hover:bg-base-800 border border-transparent hover:border-gray-300 dark:hover:border-base-700 hover:animate-liftUp ${isNavCollapsed ? 'justify-center' : 'space-x-3'} ${showSettingsPopup ? 'shadow-glow-primary border-primary/50' : ''}`}
                    >
                    <Icon name="user" className="w-5 h-5 flex-shrink-0 text-gray-700 dark:text-gray-300" />
                    <div className={`flex justify-between items-center overflow-hidden transition-all duration-300 ${isNavCollapsed ? 'w-0 opacity-0' : 'flex-1 w-full opacity-100'}`}>
                      <span className="font-medium truncate text-gradient">{activeProfile?.name || '...'}</span>
                      <Icon name="chevron-up-down" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                </button>
            </div>
            <div className={`text-center text-xs text-gray-500 dark:text-gray-500 transition-all duration-300 overflow-hidden ${isNavCollapsed ? 'opacity-0 h-0 mt-0' : 'opacity-100 h-auto mt-2'}`}>{t('dataStoredLocally')}</div>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
        <button
            onClick={() => setIsMobileNavOpen(true)}
            className="fixed top-4 left-4 z-20 lg:hidden p-2 bg-white/50 dark:bg-base-800/50 backdrop-blur-sm rounded-xl"
            aria-label={t('expandSidebar')}
        >
            <Icon name="menu" className="w-6 h-6 text-gray-800 dark:text-white"/>
        </button>
        <div className="max-w-7xl mx-auto w-full h-full">
          <div key={activeTab === Tab.CHATBOT ? `${activeTab}-${chatbotKey}` : activeTab} className="w-full h-full animate-fadeIn flex">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
