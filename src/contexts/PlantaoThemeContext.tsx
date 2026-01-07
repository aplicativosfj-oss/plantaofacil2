import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definição dos temas de segurança pública
export type PlantaoThemeType = 
  | 'policia' 
  | 'bombeiros' 
  | 'samu' 
  | 'penitenciario' 
  | 'transito' 
  | 'vigilancia'
  | 'guarda_municipal';

interface ThemeConfig {
  id: PlantaoThemeType;
  name: string;
  subtitle: string;
  icon: string; // emoji for simplicity
  teamIcons: {
    alfa: string;
    bravo: string;
    charlie: string;
    delta: string;
  };
  colors: {
    primary: string;
    accent: string;
    background: string;
    card: string;
    teamAlfa: string;
    teamBravo: string;
    teamCharlie: string;
    teamDelta: string;
  };
  sounds: {
    click: string;
    notification: string;
    alert: string;
  };
  font: string;
}

export const PLANTAO_THEMES: Record<PlantaoThemeType, ThemeConfig> = {
  policia: {
    id: 'policia',
    name: 'Operações Táticas',
    subtitle: 'Ação e patrulhamento',
    icon: '🛡️',
    teamIcons: {
      alfa: 'Shield',
      bravo: 'Star',
      charlie: 'Target',
      delta: 'Crosshair',
    },
    colors: {
      primary: '210 80% 45%',
      accent: '152 60% 40%',
      background: '220 25% 6%',
      card: '220 25% 9%',
      teamAlfa: '210 80% 50%',
      teamBravo: '45 90% 50%',
      teamCharlie: '152 60% 45%',
      teamDelta: '0 70% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  bombeiros: {
    id: 'bombeiros',
    name: 'Resgate & Incêndio',
    subtitle: 'Emergência e salvamento',
    icon: '🔥',
    teamIcons: {
      alfa: 'Flame',
      bravo: 'Siren',
      charlie: 'Truck',
      delta: 'AlertTriangle',
    },
    colors: {
      primary: '0 75% 50%',
      accent: '35 95% 55%',
      background: '0 20% 6%',
      card: '0 20% 10%',
      teamAlfa: '0 75% 55%',
      teamBravo: '35 90% 50%',
      teamCharlie: '45 95% 55%',
      teamDelta: '20 85% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  samu: {
    id: 'samu',
    name: 'Atendimento Móvel',
    subtitle: 'Primeiros socorros',
    icon: '⚕️',
    teamIcons: {
      alfa: 'Ambulance',
      bravo: 'HeartPulse',
      charlie: 'Stethoscope',
      delta: 'Activity',
    },
    colors: {
      primary: '35 95% 50%',
      accent: '0 70% 50%',
      background: '35 15% 6%',
      card: '35 15% 10%',
      teamAlfa: '35 95% 55%',
      teamBravo: '0 70% 50%',
      teamCharlie: '45 90% 55%',
      teamDelta: '25 85% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  penitenciario: {
    id: 'penitenciario',
    name: 'Custódia',
    subtitle: 'Controle e escolta',
    icon: '⛓️',
    teamIcons: {
      alfa: 'Lock',
      bravo: 'KeyRound',
      charlie: 'ShieldAlert',
      delta: 'Handcuffs',
    },
    colors: {
      primary: '220 15% 45%',
      accent: '35 60% 45%',
      background: '220 10% 8%',
      card: '220 10% 12%',
      teamAlfa: '220 20% 50%',
      teamBravo: '35 50% 45%',
      teamCharlie: '200 15% 50%',
      teamDelta: '0 40% 45%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  transito: {
    id: 'transito',
    name: 'Patrulha Viária',
    subtitle: 'Rondas e fiscalização',
    icon: '🚧',
    teamIcons: {
      alfa: 'Car',
      bravo: 'TrafficCone',
      charlie: 'Route',
      delta: 'CircleAlert',
    },
    colors: {
      primary: '145 70% 40%',
      accent: '45 90% 50%',
      background: '145 15% 6%',
      card: '145 15% 10%',
      teamAlfa: '145 70% 45%',
      teamBravo: '45 90% 50%',
      teamCharlie: '35 80% 50%',
      teamDelta: '0 70% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  vigilancia: {
    id: 'vigilancia',
    name: 'Sentinela',
    subtitle: 'Monitoramento e apoio',
    icon: '🛰️',
    teamIcons: {
      alfa: 'Eye',
      bravo: 'Radar',
      charlie: 'ScanEye',
      delta: 'Cctv',
    },
    colors: {
      primary: '270 60% 50%',
      accent: '200 70% 50%',
      background: '270 20% 6%',
      card: '270 20% 10%',
      teamAlfa: '270 60% 55%',
      teamBravo: '200 70% 50%',
      teamCharlie: '230 60% 50%',
      teamDelta: '300 50% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
  guarda_municipal: {
    id: 'guarda_municipal',
    name: 'Guarda Urbana',
    subtitle: 'Proteção comunitária',
    icon: '🏙️',
    teamIcons: {
      alfa: 'Building2',
      bravo: 'UserRoundCheck',
      charlie: 'MapPin',
      delta: 'BadgeCheck',
    },
    colors: {
      primary: '200 75% 45%',
      accent: '170 60% 45%',
      background: '200 20% 6%',
      card: '200 20% 10%',
      teamAlfa: '200 75% 50%',
      teamBravo: '170 60% 45%',
      teamCharlie: '180 65% 45%',
      teamDelta: '220 70% 50%',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: "'Inter', sans-serif",
  },
};

interface PlantaoThemeContextType {
  currentTheme: PlantaoThemeType;
  themeConfig: ThemeConfig;
  setTheme: (theme: PlantaoThemeType) => void;
  playSound: (type: 'click' | 'notification' | 'alert') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const PlantaoThemeContext = createContext<PlantaoThemeContextType | undefined>(undefined);

export const PlantaoThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<PlantaoThemeType>(() => {
    const saved = localStorage.getItem('plantao_theme');
    return (saved as PlantaoThemeType) || 'policia';
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('plantao_sound_enabled');
    return saved !== 'false';
  });

  const themeConfig = PLANTAO_THEMES[currentTheme];

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement;
    const config = PLANTAO_THEMES[currentTheme];
    
    root.style.setProperty('--primary', config.colors.primary);
    root.style.setProperty('--accent', config.colors.accent);
    root.style.setProperty('--background', config.colors.background);
    root.style.setProperty('--card', config.colors.card);
    root.style.setProperty('--team-alfa', config.colors.teamAlfa);
    root.style.setProperty('--team-bravo', config.colors.teamBravo);
    root.style.setProperty('--team-charlie', config.colors.teamCharlie);
    root.style.setProperty('--team-delta', config.colors.teamDelta);
    root.style.setProperty('--ring', config.colors.primary);
    
    localStorage.setItem('plantao_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('plantao_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  const setTheme = (theme: PlantaoThemeType) => {
    setCurrentTheme(theme);
  };

  const playSound = (type: 'click' | 'notification' | 'alert') => {
    if (!soundEnabled) return;
    
    const soundUrl = themeConfig.sounds[type];
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignorar erros de autoplay
      });
    }
  };

  return (
    <PlantaoThemeContext.Provider value={{
      currentTheme,
      themeConfig,
      setTheme,
      playSound,
      soundEnabled,
      setSoundEnabled,
    }}>
      {children}
    </PlantaoThemeContext.Provider>
  );
};

export const usePlantaoTheme = () => {
  const context = useContext(PlantaoThemeContext);
  if (!context) {
    throw new Error('usePlantaoTheme must be used within a PlantaoThemeProvider');
  }
  return context;
};
