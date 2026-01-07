import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlantaoAuthProvider } from "@/contexts/PlantaoAuthContext";
import { PlantaoThemeProvider } from "@/contexts/PlantaoThemeContext";
import { Loader2 } from "lucide-react";
import { clearExpiredCache } from "@/hooks/useOfflineStorage";

// Lazy load pages for better performance
const PlantaoHome = lazy(() => import("./pages/PlantaoHome"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const PlantaoMasterDashboard = lazy(() => import("./pages/PlantaoMasterDashboard"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized query client with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const App = () => {
  // Clear expired cache on app start
  useEffect(() => {
    clearExpiredCache();

    // Bloquear definitivamente qualquer tentativa de tocar músicas de background
    // (mantém sons curtos como clique/notificação)
    const blockedAudioSubstrings = [
      '/audio/background',
      '/audio/background-',
      '/audio/background-music',
      '/audio/peso-do-ritmo',
      '/audio/peso-neon',
      '/audio/gym-pro-funk',
      '/audio/cidade-vigilancia',
      '/audio/cidade-vigilancia.mp3',
    ];

    const originalPlay = HTMLMediaElement.prototype.play;

    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement, ...args: any[]) {
      try {
        const src = (this.currentSrc || (this as any).src || '').toString();
        if (blockedAudioSubstrings.some((s) => src.includes(s))) {
          try {
            this.pause();
            this.currentTime = 0;
          } catch {}
          return Promise.resolve();
        }
      } catch {}

      return (originalPlay as any).apply(this, args);
    };


    // Tenta parar imediatamente qualquer mídia já tocando dessas faixas
    try {
      document.querySelectorAll('audio, video').forEach((el) => {
        const media = el as HTMLMediaElement;
        const src = (media.currentSrc || (media as any).src || '').toString();
        if (blockedAudioSubstrings.some((s) => src.includes(s))) {
          try {
            media.pause();
            media.currentTime = 0;
          } catch {}
        }
      });
    } catch {}

    // Register for online/offline events
    const handleOnline = () => {
      console.log('App is online - syncing data...');
      queryClient.refetchQueries();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      HTMLMediaElement.prototype.play = originalPlay;
    };
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <PlantaoThemeProvider>
        <PlantaoAuthProvider>
          <TooltipProvider delayDuration={300}>
            <Toaster />
            <Sonner 
              position="top-center" 
              toastOptions={{
                duration: 3000,
                className: 'bg-card border-border',
              }}
            />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<PlantaoHome />} />
                  <Route path="/dashboard" element={<AgentDashboard />} />
                  <Route path="/master" element={<PlantaoMasterDashboard />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </PlantaoAuthProvider>
      </PlantaoThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
