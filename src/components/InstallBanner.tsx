import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_BANNER_KEY = 'plantao_install_banner_dismissed';

const InstallBanner: React.FC = memo(() => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if mobile and iOS
    const checkDevice = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setIsIOS(ios);
    };
    checkDevice();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check navigator.standalone for iOS
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if banner was already dismissed
    const dismissed = localStorage.getItem(INSTALL_BANNER_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 3 days
      if (daysDiff < 3) {
        return;
      }
    }

    // Listen for install prompt (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner immediately when prompt is available
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner after 1.5 seconds for mobile first-time visitors
    const timer = setTimeout(() => {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setShowBanner(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Android - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS - show instructions
      setShowIOSInstructions(true);
    } else {
      // Fallback - navigate to install page
      navigate('/install');
      setShowBanner(false);
    }
  }, [deferredPrompt, isIOS, navigate]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(INSTALL_BANNER_KEY, new Date().toISOString());
    setShowBanner(false);
    setShowIOSInstructions(false);
  }, []);

  if (isInstalled || !isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-0 right-0 z-[100] p-4 safe-area-pb"
        >
          <div className="bg-gradient-to-r from-primary to-red-600 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-primary/30 mx-auto max-w-md">
            {showIOSInstructions ? (
              // iOS Instructions
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primary-foreground text-sm flex items-center gap-2">
                    <Smartphone size={18} />
                    Instalar no iPhone/iPad
                  </h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
                  >
                    <X size={18} className="text-primary-foreground/80" />
                  </button>
                </div>
                
                <div className="space-y-2 text-primary-foreground/90 text-xs">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                    <span className="flex items-center gap-1">
                      Toque no botão <Share size={14} className="mx-1" /> <strong>Compartilhar</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                    <span className="flex items-center gap-1">
                      Role e toque em <Plus size={14} className="mx-1" /> <strong>Adicionar à Tela Inicial</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                    <span>Toque em <strong>Adicionar</strong></span>
                  </div>
                </div>

                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="secondary"
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold text-xs"
                >
                  Entendi!
                </Button>
              </motion.div>
            ) : (
              // Default Banner
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(255,255,255,0.4)',
                        '0 0 0 8px rgba(255,255,255,0)',
                        '0 0 0 0 rgba(255,255,255,0)'
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: 'easeInOut' 
                    }}
                  >
                    <Download size={24} className="text-primary-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-foreground text-sm">
                      Instalar Plantão PRO
                    </h3>
                    <p className="text-primary-foreground/80 text-xs">
                      Acesso rápido na tela inicial
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 font-semibold text-xs px-3"
                  >
                    Instalar
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
                  >
                    <X size={18} className="text-primary-foreground/80" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

InstallBanner.displayName = 'InstallBanner';

export default InstallBanner;
