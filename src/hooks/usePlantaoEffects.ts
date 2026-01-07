import { useState, useEffect, useCallback } from 'react';

const EFFECTS_KEY = 'plantao_effects_enabled';

// Controla APENAS efeitos visuais (sem áudio)
export const usePlantaoEffects = () => {
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem(EFFECTS_KEY);
    return stored !== 'false'; // enabled by default
  });

  useEffect(() => {
    localStorage.setItem(EFFECTS_KEY, String(effectsEnabled));
  }, [effectsEnabled]);

  // Mantemos a API para não quebrar chamadas existentes,
  // mas sem tocar nenhum som (pedido do usuário).
  const playClickSound = useCallback(() => {}, []);

  const toggleEffects = useCallback(() => {
    setEffectsEnabled((prev) => !prev);
  }, []);

  return {
    effectsEnabled,
    setEffectsEnabled,
    toggleEffects,
    playClickSound,
  };
};

export default usePlantaoEffects;

