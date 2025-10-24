
import React from 'react';

const ICONS = {
  gemini: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-5 13.59L8.41 14 12 10.41 15.59 14 14.17 15.41 12 13.24 9.83 15.41 8.41 14 12 10.41 15.59 14 17 12.59 12 7.59 7 12.59z" />
    </svg>
  ),
  chat: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  image: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" />
    </svg>
  ),
  video: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
  ),
  edit: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
       <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 012.829-5.526L16.5 8.25l2.25 2.25L12.28 13.08a4.5 4.5 0 01-2.467 2.824z" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5L13.5 4.5" />
    </svg>
  ),
  mic: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  search: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
  ),
  brain: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 012.829-5.526L16.5 8.25l2.25 2.25L12.28 13.08a4.5 4.5 0 01-2.467 2.824zM16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5H21a1.5 1.5 0 010 3h-2.25m-15 0H3a1.5 1.5 0 010-3h2.25m10.5-6H15a1.5 1.5 0 010-3h.75m-6 0h-.75a1.5 1.5 0 010-3h.75M12 21v-1.5m0-15V3" />
    </svg>
  ),
  volume: (
     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
       <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
     </svg>
  ),
};

export const Icon: React.FC<{ name: keyof typeof ICONS; className?: string }> = ({ name, className }) => {
  const Svg = ICONS[name];
  return <div className={className}>{Svg}</div>;
};
