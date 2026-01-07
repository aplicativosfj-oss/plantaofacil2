import { useCallback } from 'react';

// Audio completamente desabilitado
export const useClickSound = () => {
  const playClick = useCallback(() => {
    // Som desabilitado
  }, []);

  const setSoundEnabled = useCallback((_enabled: boolean) => {
    // Som desabilitado
  }, []);

  const isSoundEnabled = useCallback(() => {
    return false;
  }, []);

  return { playClick, setSoundEnabled, isSoundEnabled };
};

export default useClickSound;
