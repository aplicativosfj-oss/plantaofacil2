import React, { createContext, useContext, useState, useCallback } from 'react';

// Som de volume para SFX
const SFX_VOLUME = 0.5;
const SFX_STORAGE_KEY = 'gym_sfx_enabled';

interface AudioContextType {
  isMusicPlaying: boolean;
  isMusicEnabled: boolean;
  isSfxEnabled: boolean;
  isOnHomeScreen: boolean;
  isSplashComplete: boolean;
  analyserNode: AnalyserNode | null;
  musicVolume: number;
  currentTrackName: string;
  setMusicVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  setOnHomeScreen: (value: boolean) => void;
  setSplashComplete: (value: boolean) => void;
  stopMusicImmediately: () => void;
  tryAutoPlay: () => void;
  skipToNextTrack: () => void;
  skipToPreviousTrack: () => void;
  playClickSound: () => void;
  playHoverSound: () => void;
  playNotificationSound: () => void;
  playSuccessSound: () => void;
  playTimerSound: () => void;
  playTickSound: () => void;
  playCountdownBeep: () => void;
}

const AudioContextData = createContext<AudioContextType | undefined>(undefined);

// Singleton AudioContext para efeitos sonoros
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }
    return sharedAudioContext;
  } catch (e) {
    return null;
  }
};

// Sons sintetizados (SFX apenas)
const createSinisterClick = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.08);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

const createHoverSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.06);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME * 0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
};

const createNotificationSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(550, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME * 0.8, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.35);
};

const createSuccessSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.4);
};

const createTimerSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(880, audioContext.currentTime);
  gain1.gain.setValueAtTime(SFX_VOLUME * 0.6, audioContext.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  osc1.start(audioContext.currentTime);
  osc1.stop(audioContext.currentTime + 0.1);
  
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1100, audioContext.currentTime + 0.15);
  gain2.gain.setValueAtTime(SFX_VOLUME * 0.7, audioContext.currentTime + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  osc2.start(audioContext.currentTime + 0.15);
  osc2.stop(audioContext.currentTime + 0.3);
};

const createTickSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME * 0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
};

const createCountdownBeep = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
  
  gainNode.gain.setValueAtTime(SFX_VOLUME * 0.6, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getSfxStoredPreference = (): boolean => {
    const stored = localStorage.getItem(SFX_STORAGE_KEY);
    return stored !== 'false';
  };

  // Música de fundo completamente removida - apenas SFX
  const [isSfxEnabled, setIsSfxEnabled] = useState(getSfxStoredPreference);
  const [isOnHomeScreen, setIsOnHomeScreenState] = useState(false);
  const [isSplashComplete, setIsSplashCompleteState] = useState(false);

  // Funções de música agora são no-ops (música removida)
  const toggleMusic = useCallback(() => {}, []);
  const setMusicVolume = useCallback((_volume: number) => {}, []);
  const stopMusicImmediately = useCallback(() => {}, []);
  const tryAutoPlay = useCallback(() => {}, []);
  const skipToNextTrack = useCallback(() => {}, []);
  const skipToPreviousTrack = useCallback(() => {}, []);

  const setOnHomeScreen = useCallback((value: boolean) => {
    setIsOnHomeScreenState(value);
  }, []);

  const setSplashComplete = useCallback((value: boolean) => {
    setIsSplashCompleteState(value);
  }, []);

  const toggleSfx = useCallback(() => {
    const newEnabled = !isSfxEnabled;
    setIsSfxEnabled(newEnabled);
    localStorage.setItem(SFX_STORAGE_KEY, String(newEnabled));
  }, [isSfxEnabled]);

  // Efeitos sonoros sutis - apenas cliques habilitados
  const playClickSound = useCallback(() => {
    if (isSfxEnabled) createSinisterClick();
  }, [isSfxEnabled]);
  const playHoverSound = useCallback(() => {}, []);
  const playNotificationSound = useCallback(() => {
    if (isSfxEnabled) createNotificationSound();
  }, [isSfxEnabled]);
  const playSuccessSound = useCallback(() => {
    if (isSfxEnabled) createSuccessSound();
  }, [isSfxEnabled]);
  const playTimerSound = useCallback(() => {
    if (isSfxEnabled) createTimerSound();
  }, [isSfxEnabled]);
  const playTickSound = useCallback(() => {
    if (isSfxEnabled) createTickSound();
  }, [isSfxEnabled]);
  const playCountdownBeep = useCallback(() => {
    if (isSfxEnabled) createCountdownBeep();
  }, [isSfxEnabled]);

  return (
    <AudioContextData.Provider
      value={{
        isMusicPlaying: false,
        isMusicEnabled: false,
        isSfxEnabled,
        isOnHomeScreen,
        isSplashComplete,
        analyserNode: null,
        musicVolume: 0,
        currentTrackName: '',
        setMusicVolume,
        toggleMusic,
        toggleSfx,
        setOnHomeScreen,
        setSplashComplete,
        stopMusicImmediately,
        tryAutoPlay,
        skipToNextTrack,
        skipToPreviousTrack,
        playClickSound,
        playHoverSound,
        playNotificationSound,
        playSuccessSound,
        playTimerSound,
        playTickSound,
        playCountdownBeep,
      }}
    >
      {children}
    </AudioContextData.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContextData);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
