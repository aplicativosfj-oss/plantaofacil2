import { useCallback, useEffect, useRef } from 'react';

const CLICK_SOUND_PATH = '/audio/click.mp3';

export const useClickSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundEnabled = useRef(true);

  useEffect(() => {
    // Pre-load the audio
    audioRef.current = new Audio(CLICK_SOUND_PATH);
    audioRef.current.volume = 0.3;
    audioRef.current.preload = 'auto';

    // Check localStorage for sound preference
    const stored = localStorage.getItem('plantao_sound_enabled');
    soundEnabled.current = stored !== 'false';

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playClick = useCallback(() => {
    if (!soundEnabled.current || !audioRef.current) return;
    
    // Clone and play to allow rapid successive clicks
    const clone = audioRef.current.cloneNode() as HTMLAudioElement;
    clone.volume = 0.3;
    clone.play().catch(() => {
      // Ignore autoplay errors
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled;
    localStorage.setItem('plantao_sound_enabled', enabled.toString());
  }, []);

  const isSoundEnabled = useCallback(() => {
    return soundEnabled.current;
  }, []);

  return { playClick, setSoundEnabled, isSoundEnabled };
};

export default useClickSound;
