import { useState, useEffect, useCallback, useRef } from 'react';

const EFFECTS_KEY = 'plantao_effects_enabled';

export const usePlantaoEffects = () => {
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem(EFFECTS_KEY);
    return stored !== 'false'; // Enabled by default
  });
  
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load click sound
    clickSoundRef.current = new Audio('/audio/click.mp3');
    clickSoundRef.current.volume = 0.3;
    clickSoundRef.current.preload = 'auto';
    
    return () => {
      if (clickSoundRef.current) {
        clickSoundRef.current.pause();
        clickSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(EFFECTS_KEY, String(effectsEnabled));
  }, [effectsEnabled]);

  const playClickSound = useCallback(() => {
    if (!effectsEnabled || !clickSoundRef.current) return;
    
    // Clone and play to allow overlapping sounds
    const sound = clickSoundRef.current.cloneNode() as HTMLAudioElement;
    sound.volume = 0.3;
    sound.play().catch(() => {});
  }, [effectsEnabled]);

  const toggleEffects = useCallback(() => {
    setEffectsEnabled(prev => !prev);
  }, []);

  return {
    effectsEnabled,
    setEffectsEnabled,
    toggleEffects,
    playClickSound,
  };
};

export default usePlantaoEffects;
