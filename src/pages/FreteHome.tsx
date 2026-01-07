import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Truck, Shield, Info, Package } from 'lucide-react';
import { motion } from 'framer-motion';


import DigitalClock from '@/components/DigitalClock';
import GymButton from '@/components/GymButton';
import LoginDialog from '@/components/LoginDialog';
import AboutDialog from '@/components/AboutDialog';
import ParticlesBackground from '@/components/ParticlesBackground';
import FreteAnimatedLogo from '@/components/frete/FreteAnimatedLogo';
import AudioVisualizer from '@/components/AudioVisualizer';
import SportThemeSelector from '@/components/SportThemeSelector';
import MiniMusicPlayer from '@/components/MiniMusicPlayer';
import HoverEffectsToggle from '@/components/HoverEffectsToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';

// Chave para persistir se é primeira visita (localStorage = permanente)
const FIRST_VISIT_KEY = 'freterapido_first_visit_complete';

const FreteHome: React.FC = () => {
  // Splash só aparece na PRIMEIRA visita do dispositivo (localStorage)
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem(FIRST_VISIT_KEY);
  });
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<'client' | 'instructor' | 'admin'>('client');

  const navigate = useNavigate();
  const { licenseExpired } = useAuth();
  const { playClickSound, setOnHomeScreen, setSplashComplete, stopMusicImmediately, tryAutoPlay } = useAudio();

  // Marcar que está na tela inicial
  useEffect(() => {
    setOnHomeScreen(true);
    
    // Se não tem splash, marcar como completo imediatamente
    if (!showSplash) {
      setSplashComplete(true);
    }
    
    return () => {
      setOnHomeScreen(false);
    };
  }, [setOnHomeScreen, setSplashComplete, showSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setSplashComplete(true);
    // Marca que a primeira visita foi concluída (permanente)
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLoginDialogOpen(false);
        setAboutDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (licenseExpired) {
      navigate('/license-expired');
    }
  }, [licenseExpired, navigate]);

  const handlePanelClick = (panel: 'client' | 'instructor' | 'admin') => {
    playClickSound();
    setSelectedPanel(panel);
    // Parar música imediatamente ao abrir login
    stopMusicImmediately();
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = (role: string) => {
    setLoginDialogOpen(false);

    // Navegar diretamente para o painel correspondente
    if (role === 'master') {
      navigate('/select-panel');
    } else if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'instructor') {
      navigate('/instructor');
    } else {
      navigate('/client');
    }
  };


  return (
    <div
      className="h-screen h-[100dvh] relative overflow-hidden bg-background"
      onClick={tryAutoPlay}
      onTouchStart={tryAutoPlay}
    >
      {/* Overlay com gradiente laranja */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Animated Particles */}
      <ParticlesBackground />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-3 sm:px-4 overflow-hidden safe-area-inset">
        {/* Header with Logo */}
        <header className="pt-4 sm:pt-6 md:pt-8 flex-shrink-0">
          <div className="flex justify-center">
            <FreteAnimatedLogo size="xl" showGlow />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 py-2 sm:py-4">
          {/* Slogan Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              Chamou, <span className="text-orange-500">chegou.</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Frete, mudança e transporte de objetos com agilidade e praticidade.
            </p>
          </motion.div>

          {/* Digital Clock */}
          <DigitalClock />

          {/* Panel Buttons */}
          <div className="flex flex-wrap justify-center items-end gap-3 sm:gap-5 md:gap-8 mt-2 sm:mt-4">
            <GymButton 
              onClick={() => handlePanelClick('client')} 
              icon={Package} 
              label="CLIENTE" 
              color="primary" 
            />
            <GymButton 
              onClick={() => handlePanelClick('instructor')} 
              icon={Truck} 
              label="PRESTADOR" 
              color="secondary" 
            />
            <GymButton 
              onClick={() => handlePanelClick('admin')} 
              icon={Shield} 
              label="ADMIN" 
              color="accent" 
            />
          </div>
        </main>

        {/* Theme Selector - top left */}
        <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
          <SportThemeSelector compact />
        </div>

        {/* About Button - discreet corner */}
        <button
          onClick={() => setAboutDialogOpen(true)}
          className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 sm:p-2.5 rounded-full bg-card/40 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-md hover:scale-105 active:scale-95"
          aria-label="Sobre o aplicativo"
        >
          <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="sr-only">Sobre o Aplicativo</span>
        </button>

        {/* Hover Effects Toggle - bottom left */}
        <HoverEffectsToggle />

        {/* Mini Music Player - above footer */}
        <MiniMusicPlayer />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="py-3 sm:py-4 flex-shrink-0"
        >
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="text-orange-500 font-semibold">Frete Rápido</span> - Feijó, Acre
            </p>
          </div>
        </motion.footer>
      </div>

      {/* Dialogs */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSuccess={handleLoginSuccess}
        panelType={selectedPanel}
      />
      <AboutDialog isOpen={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} />

      {/* Audio Visualizer */}
      <AudioVisualizer />
    </div>
  );
};

export default FreteHome;
