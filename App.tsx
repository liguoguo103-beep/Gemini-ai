
import React, { useState, useMemo } from 'react';
import { Tab } from './types';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import MediaEditorAnalyzer from './components/MediaEditorAnalyzer';
import LiveConversation from './components/LiveConversation';
import GroundedSearch from './components/GroundedSearch';
import ComplexReasoning from './components/ComplexReasoning';
import TextToSpeech from './components/TextToSpeech';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATBOT);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHATBOT:
        return <Chatbot />;
      case Tab.IMAGE_GEN:
        return <ImageGenerator />;
      case Tab.VIDEO_GEN:
        return <VideoGenerator />;
      case Tab.MEDIA_EDITOR:
        return <MediaEditorAnalyzer />;
      case Tab.LIVE:
        return <LiveConversation />;
      case Tab.GROUNDING:
        return <GroundedSearch />;
      case Tab.REASONING:
        return <ComplexReasoning />;
      case Tab.TTS:
        return <TextToSpeech />;
      default:
        return null;
    }
  };
  
  const NavItem: React.FC<{ tab: Tab; icon: keyof typeof Icon }> = ({ tab, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-3 p-3 w-full text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeTab === tab
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon name={icon} className="w-5 h-5" />
      <span>{tab}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <nav className="w-64 bg-gray-800 p-4 space-y-2 flex flex-col">
        <div className="flex items-center space-x-2 p-2 mb-4">
          <Icon name="gemini" className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Gemini Studio</h1>
        </div>
        <NavItem tab={Tab.CHATBOT} icon="chat" />
        <NavItem tab={Tab.IMAGE_GEN} icon="image" />
        <NavItem tab={Tab.VIDEO_GEN} icon="video" />
        <NavItem tab={Tab.MEDIA_EDITOR} icon="edit" />
        <NavItem tab={Tab.LIVE} icon="mic" />
        <NavItem tab={Tab.GROUNDING} icon="search" />
        <NavItem tab={Tab.REASONING} icon="brain" />
        <NavItem tab={Tab.TTS} icon="volume" />
      </nav>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
