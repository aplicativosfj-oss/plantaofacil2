import { useEffect, useState, useCallback, useRef } from "react";
import PlantaoBootSplash from "@/components/plantao/PlantaoBootSplash";

type Loaded = { default: React.ComponentType };

const INTRO_SHOWN_KEY = 'plantao_intro_video_shown';
const MAX_LOAD_TIME = 10000; // 10 seconds max loading time

export default function PlantaoEntry() {
  const [LoadedPage, setLoadedPage] = useState<React.ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const loadAttempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout>;

    // Safety timeout - never stay stuck on loading screen
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !LoadedPage) {
        console.warn('PlantaoEntry: Safety timeout triggered');
        setTimedOut(true);
      }
    }, MAX_LOAD_TIME);

    const load = async () => {
      try {
        loadAttempts.current += 1;
        const mod = (await import("./PlantaoHome")) as Loaded;
        if (!cancelled) {
          setLoadedPage(() => mod.default);
          setFailed(false);
        }
      } catch (err) {
        console.error('PlantaoEntry load error:', err);
        if (!cancelled) {
          // Retry up to 3 times with increasing delay
          if (loadAttempts.current < 3) {
            retryTimeout = setTimeout(load, 500 * loadAttempts.current);
          } else {
            setFailed(true);
          }
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      clearTimeout(retryTimeout);
    };
  }, []);

  const handleRetry = useCallback(() => {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
    window.location.reload();
  }, []);

  // If page loaded, show the page immediately
  if (LoadedPage) {
    return <LoadedPage />;
  }

  // Timeout or failed - show error with retry button
  if (timedOut || failed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-lg font-medium text-foreground">
            {timedOut ? 'Carregamento demorado' : 'Falha ao carregar'}
          </p>
          <p className="text-sm text-muted-foreground">
            {timedOut 
              ? 'A página está demorando para carregar. Tente recarregar.' 
              : 'Ocorreu um problema ao carregar a página.'}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Still loading the page
  return (
    <PlantaoBootSplash
      showVideo={false}
      subtitle="Carregando..."
    />
  );
}
