import React from 'react';

// FIX: Export ICONS so its keys can be used for typing in other components.
export const ICONS = {
  gemini: (
    <svg viewBox="0 0 24 24" fill="none">
        <defs>
            <linearGradient id="icon-grad-gemini" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" stroke="url(#icon-grad-gemini)" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="10.5" stroke="url(#icon-grad-gemini)" strokeWidth="1" strokeOpacity="0.6"/>
        <path d="M8.25 16.5L12 8L15.75 16.5M10 13.5H14" stroke="url(#icon-grad-gemini)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chat: (
    <svg fill="none" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="icon-grad-chat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-color)"/>
            <stop offset="100%" stopColor="var(--secondary-color)"/>
        </linearGradient>
      </defs>
      <path stroke="url(#icon-grad-chat)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
       <path stroke="url(#icon-grad-chat)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375" />
    </svg>
  ),
  image: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-image" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-image)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" />
    </svg>
  ),
  video: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-video" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-video)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
  ),
  edit: (
    <svg fill="none" viewBox="0 0 24 24">
       <defs>
            <linearGradient id="icon-grad-edit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
       <path stroke="url(#icon-grad-edit)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 012.829-5.526L16.5 8.25l2.25 2.25L12.28 13.08a4.5 4.5 0 01-2.467 2.824z" />
       <path stroke="url(#icon-grad-edit)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5L13.5 4.5" />
    </svg>
  ),
  'code-bracket': (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-code" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-code)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" />
    </svg>
  ),
  mic: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-mic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-mic)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  search: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-search" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-search)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  sparkles: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-sparkles" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-sparkles)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25l-2.25 2.25m0 0l-2.25 2.25M14.25 10.5l2.25-2.25m0 0l2.25 2.25M4.5 19.5l2.25-2.25m0 0l2.25-2.25m-2.25 2.25L2.25 17.25m2.25 2.25L6.75 21.75" />
    </svg>
  ),
  volume: (
     <svg fill="none" viewBox="0 0 24 24">
       <defs>
            <linearGradient id="icon-grad-volume" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
       <path stroke="url(#icon-grad-volume)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
     </svg>
  ),
  cube: (
    <svg fill="none" viewBox="0 0 24 24">
       <defs>
            <linearGradient id="icon-grad-cube" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-cube)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75v9.75" />
    </svg>
  ),
  cog: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.542-.216c.386-.154.81-.154 1.196 0l.542.216c.55.219 1.02.684 1.11 1.226l.09.542c.063.375.293.693.63.864l.542.271c.4.2.632.646.632 1.12v1.082c0 .474-.232.92-.632 1.12l-.542.271c-.337.17-.567.49-.63.864l-.09.542c-.09.542-.56 1.007-1.11 1.226l-.542.216c-.386-.154-.81-.154-1.196 0l-.542-.216c-.55-.219-1.02-.684-1.11-1.226l-.09-.542a1.493 1.493 0 01-.63-.864l-.542-.271a1.923 1.923 0 01-.632-1.12V9.42c0-.474.232.92.632-1.12l.542-.271c.337-.17.567-.49.63-.864l.09-.542z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  check: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  plus: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  trash: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  pencil: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  ),
  download: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  close: (
     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
     </svg>
  ),
  user: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  globe: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-globe" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
      <path stroke="url(#icon-grad-globe)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM2.05 12H21.95M12 3c-2.4 2.4-4.5 5.7-4.5 9s2.1 6.6 4.5 9c2.4-2.4 4.5-5.7 4.5-9s-2.1-6.6-4.5-9z" />
    </svg>
  ),
  'chevron-up-down': (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
  ),
  'chevron-up': (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ),
  'chevron-down': (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  'chevron-left': (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  'chevron-right': (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  copy: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  menu: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  history: (
     <svg fill="none" viewBox="0 0 24 24">
       <defs>
            <linearGradient id="icon-grad-history" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
       <path stroke="url(#icon-grad-history)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
  ),
  'dot-spinner': (
    <div className="dot-spinner">
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
    </div>
  ),
  sun: (
    <svg fill="none" viewBox="0 0 24 24">
       <defs>
            <linearGradient id="icon-grad-sun" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-sun)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  moon: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  play: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.985V5.653z" />
    </svg>
  ),
  pause: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  ),
  subtitles: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3H20.25M3.75 3V1.5A2.25 2.25 0 016 0h12a2.25 2.25 0 012.25 1.5V3m-13.5 7.5h9m-9 3h6" />
    </svg>
  ),
  'subtitles-slash': (
     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3H20.25M3.75 3V1.5A2.25 2.25 0 016 0h12a2.25 2.25 0 012.25 1.5V3m-13.5 7.5h9m-9 3h6m-9.75-9.75l15 15" />
    </svg>
  ),
  lightbulb: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-lightbulb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-lightbulb)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10.5 14.25h3m-6.75 6h10.5c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125h-10.5c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125zM10.5 14.25V6.375c0-1.24 1.01-2.25 2.25-2.25h.007a2.25 2.25 0 012.243 2.25v7.875" />
    </svg>
  ),
  bookmark: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-bookmark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-bookmark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17.25 3H6.75A2.25 2.25 0 004.5 5.25v16.5l7.5-3.75 7.5 3.75V5.25A2.25 2.25 0 0017.25 3z" />
    </svg>
  ),
  calculator: (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-calculator" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-calculator)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'shield-check': (
    <svg fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="icon-grad-shield-check" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)"/>
                <stop offset="100%" stopColor="var(--secondary-color)"/>
            </linearGradient>
        </defs>
        <path stroke="url(#icon-grad-shield-check)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
        <path stroke="url(#icon-grad-shield-check)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  ),
};

export const Icon: React.FC<{ name: keyof typeof ICONS; className?: string }> = ({ name, className }) => {
  const Svg = ICONS[name];
  return <div className={className}>{Svg}</div>;
};