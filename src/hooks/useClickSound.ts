import { useCallback, useRef, useEffect } from 'react';

// Audio manager singleton
let clickAudio: HTMLAudioElement | null = null;
let isInitialized = false;

const initAudio = () => {
  if (isInitialized) return;
  clickAudio = new Audio('/audio/click.mp3');
  clickAudio.volume = 0.35;
  clickAudio.preload = 'auto';
  isInitialized = true;
};

export const useClickSound = () => {
  // Initialize on first use
  useEffect(() => {
    initAudio();
  }, []);

  const isSoundEnabled = useCallback(() => {
    return localStorage.getItem('plantao_sound_enabled') === 'true';
  }, []);

  const playClick = useCallback(() => {
    if (!isSoundEnabled()) return;
    if (!clickAudio) {
      initAudio();
    }
    
    if (clickAudio) {
      // Clone audio for rapid successive clicks
      const audio = clickAudio.cloneNode() as HTMLAudioElement;
      audio.volume = 0.35;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isSoundEnabled]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem('plantao_sound_enabled', String(enabled));
  }, []);

  return { playClick, setSoundEnabled, isSoundEnabled };
};

export default useClickSound;
