import { lazy, Suspense, useEffect, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlantaoAuthProvider } from "@/contexts/PlantaoAuthContext";
import { PlantaoThemeProvider } from "@/contexts/PlantaoThemeContext";
import { MotionConfig } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { clearExpiredCache as clearLocalStorageCache } from "@/hooks/useOfflineStorage";
import { clearExpiredCache as clearIndexedDBCache } from "@/lib/indexedDB";

// Lazy load non-critical components
const InstallBanner = lazy(() => import("@/components/InstallBanner"));
const OfflineBanner = lazy(() => import("@/components/shared/OfflineBanner"));


// Páginas (FORÇA BRUTA): sem lazy import para evitar falha de chunks/caches no PWA
import PlantaoEntry from "./pages/PlantaoEntry";
import AgentDashboard from "./pages/AgentDashboard";
import PlantaoMasterDashboard from "./pages/PlantaoMasterDashboard";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";


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
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Clear expired caches on app start (defer para não travar o first paint)
  useEffect(() => {
    // FORÇA BRUTA (1x): em alguns aparelhos o PWA pode manter chunks/caches antigos
    // e isso impede páginas lazy de carregarem. Aqui limpamos caches + SW e recarregamos.
    const HARD_RESET_KEY = 'plantao_hard_reset_v1';
    const shouldHardReset = (() => {
      try {
        return localStorage.getItem(HARD_RESET_KEY) !== '1';
      } catch {
        return false;
      }
    })();

    if (shouldHardReset) {
      try {
        localStorage.setItem(HARD_RESET_KEY, '1');
      } catch {}

      (async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        } catch {}

        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {}

        try {
          // Limpa caches internos (não apaga login)
          clearLocalStorageCache();
        } catch {}
        try {
          await clearIndexedDBCache();
        } catch {}

        window.location.reload();
      })();

      return;
    }

    const runIdle = (fn: () => void) => {
      const ric = (window as any).requestIdleCallback as
        | undefined
        | ((cb: () => void, opts?: { timeout: number }) => number);
      if (typeof ric === 'function') {
        ric(fn, { timeout: 1500 });
        return;
      }
      setTimeout(fn, 50);
    };

    runIdle(() => {
      // Clear both localStorage and IndexedDB caches
      try {
        clearLocalStorageCache();
      } catch {}
      clearIndexedDBCache().catch(console.warn);
    });

    // Apenas silenciar vídeos de background que não têm controls (exceto intro)
    const sanitizeVideoElement = (el: Element) => {
      try {
        const tag = (el.tagName || '').toUpperCase();
        if (tag === 'VIDEO') {
          const video = el as HTMLVideoElement;
          const src = video.currentSrc || video.src || '';
          const isIntroVideo = src.includes('intro-plantao');
          // Only mute background videos without controls (not the intro)
          if (!video.controls && !isIntroVideo) {
            try {
              video.muted = true;
              video.volume = 0;
            } catch {}
          }
        }
      } catch {}
    };

    // Reforço inicial para vídeos de background (uma vez só)
    try {
      document.querySelectorAll('video').forEach((el) => sanitizeVideoElement(el));
    } catch {}

    // Observa elementos adicionados dinamicamente - versão otimizada (não varre o DOM inteiro)
    const mo = new MutationObserver((mutations) => {
      try {
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (!(node instanceof Element)) continue;

            // Se o próprio nó é vídeo
            if (node.tagName === 'VIDEO') {
              sanitizeVideoElement(node);
            }

            // Se contém vídeo internamente
            const innerVideos = node.querySelectorAll?.('video');
            if (innerVideos && innerVideos.length) {
              innerVideos.forEach((el) => sanitizeVideoElement(el));
            }
          }
        }
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
        mo?.disconnect?.();
      } catch {}
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
            <MotionConfig reducedMotion="user">
              <BrowserRouter>
                <LazyErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<PlantaoEntry />} />
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
            </MotionConfig>
          </TooltipProvider>
        </PlantaoAuthProvider>
      </PlantaoThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
