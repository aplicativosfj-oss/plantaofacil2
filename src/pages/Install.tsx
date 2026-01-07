import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Share, 
  Plus,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  Bell,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Detect Android
    setIsAndroid(/Android/.test(navigator.userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: 'Acesso Rápido',
      description: 'Abra direto da tela inicial, sem navegador'
    },
    {
      icon: WifiOff,
      title: 'Funciona Offline',
      description: 'Use mesmo sem conexão com internet'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba alertas de plantões e trocas'
    },
    {
      icon: Shield,
      title: 'Seguro',
      description: 'Seus dados protegidos localmente'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Instalar App</h1>
            <p className="text-sm text-muted-foreground">
              Plantão PRO na sua tela inicial
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src={plantaoLogo} 
            alt="Plantão PRO" 
            className="w-24 h-24 mx-auto object-contain"
          />
        </div>

        {/* Online Status */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-6 ${
            isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isOnline ? 'Conectado' : 'Modo Offline'}
          </span>
        </motion.div>

        {/* Install Status */}
        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">App Instalado!</h2>
            <p className="text-muted-foreground mb-6">
              O Plantão PRO já está na sua tela inicial
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <Smartphone className="w-4 h-4" />
              Abrir App
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Install Card */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="w-5 h-5 text-primary" />
                  {isIOS ? 'Instalar no iPhone/iPad' : 'Instalar no Dispositivo'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isIOS ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Para instalar no iOS, siga estes passos:
                    </p>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Toque no botão <Share className="w-4 h-4 inline mx-1" /> Compartilhar</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>Role e toque em <Plus className="w-4 h-4 inline mx-1" /> "Adicionar à Tela de Início"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Toque em "Adicionar" no canto superior direito</span>
                      </li>
                    </ol>
                  </div>
                ) : deferredPrompt ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Instale o app para acesso rápido e uso offline
                    </p>
                    <Button onClick={handleInstallClick} className="w-full gap-2" size="lg">
                      <Download className="w-5 h-5" />
                      Instalar Agora
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Para instalar, use o menu do navegador:
                    </p>
                    <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                      <span>Menu ⋮ → "Instalar app" ou "Adicionar à tela inicial"</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features Grid */}
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Benefícios do App
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <feature.icon className="w-8 h-8 text-primary mb-2" />
                      <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* APK Info */}
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Quer o APK para Android?
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Para gerar o APK nativo, exporte o projeto para o GitHub e siga as instruções do Capacitor:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Exporte para GitHub</li>
                  <li>2. Clone o repositório</li>
                  <li>3. Execute: <code className="bg-background px-1 rounded">npx cap add android</code></li>
                  <li>4. Execute: <code className="bg-background px-1 rounded">npx cap open android</code></li>
                  <li>5. Gere o APK no Android Studio</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Voltar ao App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
