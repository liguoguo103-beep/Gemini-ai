
export enum Tab {
  CHATBOT = 'Chatbot',
  IMAGE_GEN = 'Image Generation',
  VIDEO_GEN = 'Video Generation',
  MEDIA_EDITOR = 'Media Tools',
  LIVE = 'Live Conversation',
  GROUNDING = 'Grounded Search',
  REASONING = 'Complex Reasoning',
  TTS = 'Text-to-Speech',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            uri: string;
            reviewText: string;
            author: string;
        }[]
    }
  };
}

// FIX: Define the AIStudio interface to resolve a conflict with existing global type declarations.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Window interface augmentation for aistudio
declare global {
  interface Window {
    aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
