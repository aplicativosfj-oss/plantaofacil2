import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LucideIcon, Shield, Star, Target, Crosshair, Flame, Siren, Truck, AlertTriangle, Ambulance, HeartPulse, Stethoscope, Activity, Lock, KeyRound, ShieldAlert, Link2, Car, Construction, Route, CircleAlert, Eye, Radar, ScanEye, Cctv, Building2, UserRoundCheck, MapPin, BadgeCheck, Sword, Zap, Radio, Fingerprint, Scale, Gavel, FileSearch, Users, Megaphone, Bell, Timer, Clock } from 'lucide-react';

// Definição dos temas de segurança pública
export type PlantaoThemeType = 
  | 'policia' 
  | 'bombeiros' 
  | 'samu' 
  | 'penitenciario' 
  | 'transito' 
  | 'vigilancia'
  | 'guarda_municipal';

// Ícone com metadata
export interface ThemeIcon {
  icon: LucideIcon;
  name: string;
}

interface ThemeConfig {
  id: PlantaoThemeType;
  name: string;
  subtitle: string;
  slogan: string;
  emoji: string;
  mainIcon: LucideIcon;
  teamIcons: {
    alfa: ThemeIcon;
    bravo: ThemeIcon;
    charlie: ThemeIcon;
    delta: ThemeIcon;
  };
  decorativeIcons: LucideIcon[];
  colors: {
    primary: string;
    accent: string;
    background: string;
    card: string;
    teamAlfa: string;
    teamBravo: string;
    teamCharlie: string;
    teamDelta: string;
    gradient: string;
  };
  sounds: {
    click: string;
    notification: string;
    alert: string;
  };
  font: {
    display: string;
    body: string;
  };
  style: {
    titleSize: string;
    iconSize: string;
    borderRadius: string;
    buttonStyle: string;
  };
}

export const PLANTAO_THEMES: Record<PlantaoThemeType, ThemeConfig> = {
  policia: {
    id: 'policia',
    name: 'FORÇA TÁTICA',
    subtitle: 'Operações Especiais',
    slogan: 'Servir e Proteger',
    emoji: '🛡️',
    mainIcon: Shield,
    teamIcons: {
      alfa: { icon: Shield, name: 'Escudo' },
      bravo: { icon: Star, name: 'Estrela' },
      charlie: { icon: Target, name: 'Alvo' },
      delta: { icon: Crosshair, name: 'Mira' },
    },
    decorativeIcons: [Shield, Radio, Fingerprint, Sword, Star, Target],
    colors: {
      primary: '210 80% 45%',
      accent: '152 60% 40%',
      background: '220 25% 6%',
      card: '220 25% 9%',
      teamAlfa: '210 80% 50%',
      teamBravo: '45 90% 50%',
      teamCharlie: '152 60% 45%',
      teamDelta: '0 70% 50%',
      gradient: 'from-blue-600 via-blue-700 to-slate-800',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-3xl',
      iconSize: 'w-7 h-7',
      borderRadius: 'rounded-lg',
      buttonStyle: 'uppercase tracking-wider font-bold',
    },
  },
  bombeiros: {
    id: 'bombeiros',
    name: 'RESGATE',
    subtitle: 'Combate a Incêndio',
    slogan: 'Vida Alheia e Riquezas Salvar',
    emoji: '🔥',
    mainIcon: Flame,
    teamIcons: {
      alfa: { icon: Flame, name: 'Chama' },
      bravo: { icon: Siren, name: 'Sirene' },
      charlie: { icon: Truck, name: 'Viatura' },
      delta: { icon: AlertTriangle, name: 'Alerta' },
    },
    decorativeIcons: [Flame, Siren, Truck, AlertTriangle, Bell, Timer],
    colors: {
      primary: '0 75% 50%',
      accent: '35 95% 55%',
      background: '0 20% 6%',
      card: '0 20% 10%',
      teamAlfa: '0 75% 55%',
      teamBravo: '35 90% 50%',
      teamCharlie: '45 95% 55%',
      teamDelta: '20 85% 50%',
      gradient: 'from-red-600 via-orange-600 to-yellow-600',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-4xl',
      iconSize: 'w-8 h-8',
      borderRadius: 'rounded-xl',
      buttonStyle: 'uppercase tracking-widest font-black',
    },
  },
  samu: {
    id: 'samu',
    name: 'SAMU 192',
    subtitle: 'Urgência Médica',
    slogan: 'Atendimento Pré-Hospitalar',
    emoji: '⚕️',
    mainIcon: HeartPulse,
    teamIcons: {
      alfa: { icon: Ambulance, name: 'UTI Móvel' },
      bravo: { icon: HeartPulse, name: 'Pulso' },
      charlie: { icon: Stethoscope, name: 'Médico' },
      delta: { icon: Activity, name: 'Monitor' },
    },
    decorativeIcons: [Ambulance, HeartPulse, Stethoscope, Activity, Clock, Bell],
    colors: {
      primary: '35 95% 50%',
      accent: '0 70% 50%',
      background: '35 15% 6%',
      card: '35 15% 10%',
      teamAlfa: '35 95% 55%',
      teamBravo: '0 70% 50%',
      teamCharlie: '45 90% 55%',
      teamDelta: '25 85% 50%',
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-3xl',
      iconSize: 'w-7 h-7',
      borderRadius: 'rounded-2xl',
      buttonStyle: 'font-bold tracking-wide',
    },
  },
  penitenciario: {
    id: 'penitenciario',
    name: 'CUSTÓDIA',
    subtitle: 'Sistema Prisional',
    slogan: 'Ordem e Disciplina',
    emoji: '⛓️',
    mainIcon: Lock,
    teamIcons: {
      alfa: { icon: Lock, name: 'Cadeado' },
      bravo: { icon: KeyRound, name: 'Chave' },
      charlie: { icon: ShieldAlert, name: 'Segurança' },
      delta: { icon: Link2, name: 'Algema' },
    },
    decorativeIcons: [Lock, KeyRound, ShieldAlert, Link2, Scale, Gavel],
    colors: {
      primary: '220 15% 45%',
      accent: '35 60% 45%',
      background: '220 10% 8%',
      card: '220 10% 12%',
      teamAlfa: '220 20% 50%',
      teamBravo: '35 50% 45%',
      teamCharlie: '200 15% 50%',
      teamDelta: '0 40% 45%',
      gradient: 'from-slate-600 via-gray-700 to-zinc-800',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-3xl',
      iconSize: 'w-6 h-6',
      borderRadius: 'rounded-md',
      buttonStyle: 'uppercase tracking-widest font-semibold',
    },
  },
  transito: {
    id: 'transito',
    name: 'TRÂNSITO',
    subtitle: 'Patrulha Rodoviária',
    slogan: 'Segurança nas Vias',
    emoji: '🚧',
    mainIcon: Car,
    teamIcons: {
      alfa: { icon: Car, name: 'Viatura' },
      bravo: { icon: Construction, name: 'Operação' },
      charlie: { icon: Route, name: 'Rota' },
      delta: { icon: CircleAlert, name: 'Atenção' },
    },
    decorativeIcons: [Car, Construction, Route, CircleAlert, MapPin, Timer],
    colors: {
      primary: '145 70% 40%',
      accent: '45 90% 50%',
      background: '145 15% 6%',
      card: '145 15% 10%',
      teamAlfa: '145 70% 45%',
      teamBravo: '45 90% 50%',
      teamCharlie: '35 80% 50%',
      teamDelta: '0 70% 50%',
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-3xl',
      iconSize: 'w-7 h-7',
      borderRadius: 'rounded-lg',
      buttonStyle: 'uppercase font-bold tracking-wide',
    },
  },
  vigilancia: {
    id: 'vigilancia',
    name: 'SENTINELA',
    subtitle: 'Vigilância Eletrônica',
    slogan: 'Olhos que Protegem',
    emoji: '🛰️',
    mainIcon: Eye,
    teamIcons: {
      alfa: { icon: Eye, name: 'Observador' },
      bravo: { icon: Radar, name: 'Radar' },
      charlie: { icon: ScanEye, name: 'Scanner' },
      delta: { icon: Cctv, name: 'CFTV' },
    },
    decorativeIcons: [Eye, Radar, ScanEye, Cctv, FileSearch, Radio],
    colors: {
      primary: '270 60% 50%',
      accent: '200 70% 50%',
      background: '270 20% 6%',
      card: '270 20% 10%',
      teamAlfa: '270 60% 55%',
      teamBravo: '200 70% 50%',
      teamCharlie: '230 60% 50%',
      teamDelta: '300 50% 50%',
      gradient: 'from-purple-600 via-violet-600 to-indigo-600',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-2xl',
      iconSize: 'w-6 h-6',
      borderRadius: 'rounded-xl',
      buttonStyle: 'font-medium tracking-wider',
    },
  },
  guarda_municipal: {
    id: 'guarda_municipal',
    name: 'GUARDA CIVIL',
    subtitle: 'Proteção Urbana',
    slogan: 'Cidadão em Primeiro Lugar',
    emoji: '🏙️',
    mainIcon: Building2,
    teamIcons: {
      alfa: { icon: Building2, name: 'Sede' },
      bravo: { icon: UserRoundCheck, name: 'Agente' },
      charlie: { icon: MapPin, name: 'Ponto' },
      delta: { icon: BadgeCheck, name: 'Distintivo' },
    },
    decorativeIcons: [Building2, UserRoundCheck, MapPin, BadgeCheck, Users, Megaphone],
    colors: {
      primary: '200 75% 45%',
      accent: '170 60% 45%',
      background: '200 20% 6%',
      card: '200 20% 10%',
      teamAlfa: '200 75% 50%',
      teamBravo: '170 60% 45%',
      teamCharlie: '180 65% 45%',
      teamDelta: '220 70% 50%',
      gradient: 'from-sky-600 via-cyan-600 to-teal-600',
    },
    sounds: {
      click: '/audio/click.mp3',
      notification: '/audio/notification.mp3',
      alert: '/audio/notification.mp3',
    },
    font: {
      display: "'Bebas Neue', sans-serif",
      body: "'Inter', sans-serif",
    },
    style: {
      titleSize: 'text-3xl',
      iconSize: 'w-7 h-7',
      borderRadius: 'rounded-lg',
      buttonStyle: 'uppercase font-bold tracking-wide',
    },
  },
};

// Helper para obter ícone da equipe
export const getTeamIcon = (team: 'alfa' | 'bravo' | 'charlie' | 'delta', themeConfig: ThemeConfig): LucideIcon => {
  return themeConfig.teamIcons[team].icon;
};

// Helper para compatibilidade com código antigo
export const getTeamIconName = (team: 'alfa' | 'bravo' | 'charlie' | 'delta', themeConfig: ThemeConfig): string => {
  return themeConfig.teamIcons[team].name;
};

interface PlantaoThemeContextType {
  currentTheme: PlantaoThemeType;
  themeConfig: ThemeConfig;
  setTheme: (theme: PlantaoThemeType) => void;
  playSound: (type: 'click' | 'notification' | 'alert') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  getTeamIcon: (team: 'alfa' | 'bravo' | 'charlie' | 'delta') => LucideIcon;
}

const PlantaoThemeContext = createContext<PlantaoThemeContextType | undefined>(undefined);

export const PlantaoThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<PlantaoThemeType>(() => {
    const saved = localStorage.getItem('plantao_theme');
    return (saved as PlantaoThemeType) || 'policia';
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('plantao_sound_enabled');
    return saved === 'true';
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
    
    // Aplicar fonte do tema
    root.style.setProperty('--font-display', config.font.display);
    root.style.setProperty('--font-body', config.font.body);
    
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
      audio.play().catch(() => {});
    }
  };

  const getTeamIconForTheme = (team: 'alfa' | 'bravo' | 'charlie' | 'delta'): LucideIcon => {
    return themeConfig.teamIcons[team].icon;
  };

  return (
    <PlantaoThemeContext.Provider value={{
      currentTheme,
      themeConfig,
      setTheme,
      playSound,
      soundEnabled,
      setSoundEnabled,
      getTeamIcon: getTeamIconForTheme,
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
