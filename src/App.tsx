import { lazy, Suspense, useEffect, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlantaoAuthProvider } from "@/contexts/PlantaoAuthContext";
import { PlantaoThemeProvider } from "@/contexts/PlantaoThemeContext";
import { RefreshCw } from "lucide-react";
import { clearExpiredCache as clearLocalStorageCache } from "@/hooks/useOfflineStorage";
import { clearExpiredCache as clearIndexedDBCache } from "@/lib/indexedDB";

// Lazy load non-critical components
const InstallBanner = lazy(() => import("@/components/InstallBanner"));
const OfflineBanner = lazy(() => import("@/components/shared/OfflineBanner"));

// Lazy load pages with retry logic for failed imports
const retryImport = <T extends { default: unknown }>(
  importFn: () => Promise<T>,
  retries = 2
): Promise<T> => {
  return importFn().catch((error) => {
    if (retries > 0) {
      return new Promise<T>((resolve) => {
        setTimeout(() => resolve(retryImport(importFn, retries - 1)), 300);
      });
    }
    throw error;
  });
};

// Lazy load pages - PlantaoHome loads immediately, others on demand
const PlantaoHome = lazy(() => import("./pages/PlantaoHome"));
const AgentDashboard = lazy(() => retryImport(() => import("./pages/AgentDashboard")));
const PlantaoMasterDashboard = lazy(() => retryImport(() => import("./pages/PlantaoMasterDashboard")));
const Install = lazy(() => retryImport(() => import("./pages/Install")));
const NotFound = lazy(() => retryImport(() => import("./pages/NotFound")));

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

// Error boundary for lazy loading failures
interface ErrorBoundaryState {
  hasError: boolean;
}

class LazyErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleRetry = () => {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => 
        Promise.all(regs.map(r => r.unregister()))
      ).catch(() => {});
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <p className="text-lg font-medium text-foreground">Erro ao carregar</p>
            <p className="text-sm text-muted-foreground">
              Ocorreu um problema ao carregar a página.
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Clear expired caches on app start
  useEffect(() => {
    // Clear both localStorage and IndexedDB caches
    clearLocalStorageCache();
    clearIndexedDBCache().catch(console.warn);

    // Bloqueio de áudio HTML: evita qualquer “música/player” nos painéis.
    // Sons do app ficam apenas via WebAudio (cliques), e o vídeo de intro pode ter som.
    const originalPlay = HTMLMediaElement.prototype.play;

    const isIntroSplash = (src: string) => src.includes('/video/intro-splash.mp4');

    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement, ...args: any[]) {
      try {
        const tag = (this.tagName || '').toUpperCase();
        const src = (this.currentSrc || (this as any).src || '').toString();

        // Bloqueia TODO <audio> (inclui players e músicas)
        if (tag === 'AUDIO') {
          try {
            this.pause();
            this.currentTime = 0;
          } catch {}
          return Promise.resolve();
        }

        // Mantém vídeos de fundo mudos, mas libera o vídeo da intro
        if (tag === 'VIDEO') {
          try {
            const videoEl = this as HTMLVideoElement;
            if (!videoEl.controls && !isIntroSplash(src)) {
              videoEl.muted = true;
              videoEl.volume = 0;
            }
          } catch {}
        }
      } catch {}

      return (originalPlay as any).apply(this, args);
    };

    // Reforço: parar qualquer <audio> já tocando
    try {
      document.querySelectorAll('audio').forEach((el) => {
        const media = el as HTMLAudioElement;
        try {
          media.pause();
          media.currentTime = 0;
        } catch {}
      });

      // Reforço: garantir que vídeos de fundo (sem controles) fiquem mudos
      document.querySelectorAll('video').forEach((el) => {
        const video = el as HTMLVideoElement;
        const src = (video.currentSrc || (video as any).src || '').toString();
        try {
          if (!video.controls && !isIntroSplash(src)) {
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
          try {
            media.pause();
            media.currentTime = 0;
          } catch {}
        });
        document.querySelectorAll('video').forEach((el) => {
          const video = el as HTMLVideoElement;
          const src = (video.currentSrc || (video as any).src || '').toString();
          try {
            if (!video.controls && !isIntroSplash(src)) {
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
          <TooltipProvider delayDuration={200}>
            <Toaster />
            <Sonner 
              position="top-center" 
              toastOptions={{
                duration: 2500,
                className: 'bg-card border-border',
              }}
            />
            <BrowserRouter>
              <LazyErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<PlantaoHome />} />
                    <Route path="/dashboard" element={<AgentDashboard />} />
                    <Route path="/master" element={<PlantaoMasterDashboard />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Suspense fallback={null}>
                  <InstallBanner />
                  <OfflineBanner />
                </Suspense>
              </LazyErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </PlantaoAuthProvider>
      </PlantaoThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
