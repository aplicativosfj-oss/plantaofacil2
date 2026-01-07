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

// Synchronous cache reset check - BEFORE component renders
const CACHE_RESET_KEY = 'plantaopro_cache_reset_v3';
if (typeof window !== 'undefined' && localStorage.getItem(CACHE_RESET_KEY) !== '1') {
  localStorage.setItem(CACHE_RESET_KEY, '1');
  // Clear caches synchronously where possible, then reload
  if ('caches' in window) {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => 
      Promise.all(regs.map(r => r.unregister()))
    ).catch(() => {});
  }
  // Small delay to let cleanup finish before reload
  setTimeout(() => window.location.reload(), 100);
}

const App = () => {
  // Clear expired cache on app start
  useEffect(() => {
    clearExpiredCache();

    // Bloquear definitivamente qualquer tentativa de tocar MÚSICA de background
    // (deixa passar áudios normais do app, mas nunca permite faixas de música nem áudio em loop)
    const blockedMusicSubstrings = [
      '/audio/peso-do-ritmo',
      '/audio/peso-neon',
      '/audio/background',
      '/audio/background-music',
      '/audio/gym-pro-funk',
      '/audio/cidade-vigilancia',
    ];

    const originalPlay = HTMLMediaElement.prototype.play;

    const shouldBlockAudio = (el: HTMLMediaElement, src: string) => {
      // nunca permitir áudio em loop (isso vira "música de fundo")
      if ((el as HTMLAudioElement).loop) return true;
      return blockedMusicSubstrings.some((s) => src.includes(s));
    };

    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement, ...args: any[]) {
      try {
        const tag = (this.tagName || '').toUpperCase();
        const src = (this.currentSrc || (this as any).src || '').toString();

        // Áudio: bloqueia apenas música de background (e qualquer loop)
        if (tag === 'AUDIO') {
          if (shouldBlockAudio(this, src)) {
            try {
              this.pause();
              this.currentTime = 0;
            } catch {}
            return Promise.resolve();
          }
        }

        // Vídeo: se não tiver controles (ex: splash/background), sempre mudo
        if (tag === 'VIDEO') {
          try {
            const videoEl = this as HTMLVideoElement;
            if (!videoEl.controls) {
              videoEl.muted = true;
              videoEl.volume = 0;
            }
          } catch {}
        }
      } catch {}

      return (originalPlay as any).apply(this, args);
    };

    // Reforço: parar qualquer <audio> já tocando que seja música (ou loop)
    try {
      document.querySelectorAll('audio').forEach((el) => {
        const media = el as HTMLAudioElement;
        const src = (media.currentSrc || (media as any).src || '').toString();
        if (shouldBlockAudio(media, src)) {
          try {
            media.pause();
            media.currentTime = 0;
          } catch {}
        }
      });

      // Reforço: garantir que vídeos de fundo (sem controles) fiquem mudos
      document.querySelectorAll('video').forEach((el) => {
        const video = el as HTMLVideoElement;
        try {
          if (!video.controls) {
            video.muted = true;
            video.volume = 0;
          }
        } catch {}
      });
    } catch {}

    // Observa elementos adicionados dinamicamente (ex: modais, splash, etc.)
    const mo = new MutationObserver(() => {
      try {
        document.querySelectorAll('audio').forEach((el) => {
          const media = el as HTMLAudioElement;
          const src = (media.currentSrc || (media as any).src || '').toString();
          if (shouldBlockAudio(media, src)) {
            try {
              media.pause();
              media.currentTime = 0;
            } catch {}
          }
        });
        document.querySelectorAll('video').forEach((el) => {
          const video = el as HTMLVideoElement;
          try {
            if (!video.controls) {
              video.muted = true;
              video.volume = 0;
            }
          } catch {}
        });
      } catch {}
    });

    try {
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch {}


    // Register for online/offline events
    const handleOnline = () => {
      console.log('App is online - syncing data...');
      queryClient.refetchQueries();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      try {
        // @ts-ignore
        mo?.disconnect?.();
      } catch {}
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
