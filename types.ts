export enum Tab {
  CHATBOT = 'CHATBOT',
  IMAGE_GEN = 'IMAGE_GEN',
  VIDEO_GEN = 'VIDEO_GEN',
  MEDIA_EDITOR = 'MEDIA_EDITOR',
  OFFLINE_ASSISTANT = 'OFFLINE_ASSISTANT',
  LIVE = 'LIVE',
  GROUNDING = 'GROUNDING',
  REASONING = 'REASONING',
  TTS = 'TTS',
  CODE_GEN = 'CODE_GEN',
}

// A Part can be either text or inline data (like an image).
export type Part = { text: string; } | { inlineData: { mimeType: string; data: string; }; };

// FIX: Made properties optional to align with the GroundingChunk type from @google/genai.
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            uri?: string;
            reviewText?: string;
            author?: string;
        }[]
    }
  };
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// FIX: Removed conflicting AIStudio interface and window.aistudio declaration.
// The error indicates these types are already declared globally, so re-declaring them
// causes a conflict. The `webkitAudioContext` is kept for cross-browser compatibility.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}