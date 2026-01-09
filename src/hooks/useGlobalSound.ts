import { useCallback, useRef, useEffect } from 'react';

// Singleton audio manager for consistent sound playback
class AudioManager {
  private static instance: AudioManager;
  private clickAudio: HTMLAudioElement | null = null;
  private notificationAudio: HTMLAudioElement | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  initialize() {
    if (this.isInitialized) return;
    
    // Pre-load sounds
    this.clickAudio = new Audio('/audio/click.mp3');
    this.clickAudio.volume = 0.35;
    this.clickAudio.preload = 'auto';

    this.notificationAudio = new Audio('/audio/notification.mp3');
    this.notificationAudio.volume = 0.4;
    this.notificationAudio.preload = 'auto';

    this.isInitialized = true;
  }

  playClick() {
    if (!this.clickAudio) return;
    
    // Clone and play for rapid successive clicks
    const audio = this.clickAudio.cloneNode() as HTMLAudioElement;
    audio.volume = 0.35;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  playNotification() {
    if (!this.notificationAudio) return;
    
    const audio = this.notificationAudio.cloneNode() as HTMLAudioElement;
    audio.volume = 0.4;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

export const useGlobalSound = () => {
  const soundEnabledRef = useRef(() => {
    const stored = localStorage.getItem('plantao_sound_enabled');
    return stored === 'true';
  });

  // Initialize audio manager on mount
  useEffect(() => {
    AudioManager.getInstance().initialize();
  }, []);

  const isSoundEnabled = useCallback(() => {
    const stored = localStorage.getItem('plantao_sound_enabled');
    return stored === 'true';
  }, []);

  const playClick = useCallback(() => {
    if (isSoundEnabled()) {
      AudioManager.getInstance().playClick();
    }
  }, [isSoundEnabled]);

  const playNotification = useCallback(() => {
    if (isSoundEnabled()) {
      AudioManager.getInstance().playNotification();
    }
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    const current = localStorage.getItem('plantao_sound_enabled') === 'true';
    const newValue = !current;
    localStorage.setItem('plantao_sound_enabled', String(newValue));
    
    // Play click to confirm sound is on
    if (newValue) {
      AudioManager.getInstance().playClick();
    }
    
    return newValue;
  }, []);

  return {
    playClick,
    playNotification,
    toggleSound,
    isSoundEnabled,
  };
};

export default useGlobalSound;
