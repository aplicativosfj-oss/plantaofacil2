import { useState, useEffect, useCallback, useRef } from 'react';

const EFFECTS_KEY = 'plantao_effects_enabled';
const SOUND_KEY = 'plantao_sound_enabled';

// Controla efeitos visuais E sonoros
export const usePlantaoEffects = () => {
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem(EFFECTS_KEY);
    return stored !== 'false'; // enabled by default
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored === 'true'; // disabled by default
  });

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load click sound
  useEffect(() => {
    clickAudioRef.current = new Audio('/audio/click.mp3');
    clickAudioRef.current.volume = 0.3;
    clickAudioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    localStorage.setItem(EFFECTS_KEY, String(effectsEnabled));
  }, [effectsEnabled]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const playClickSound = useCallback(() => {
    if (soundEnabled && clickAudioRef.current) {
      // Clone and play to allow rapid successive clicks
      const audio = clickAudioRef.current.cloneNode() as HTMLAudioElement;
      audio.volume = 0.25;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  const toggleEffects = useCallback(() => {
    setEffectsEnabled((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    effectsEnabled,
    setEffectsEnabled,
    toggleEffects,
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playClickSound,
  };
};

export default usePlantaoEffects;

