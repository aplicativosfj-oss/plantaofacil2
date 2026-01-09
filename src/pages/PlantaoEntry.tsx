import { useEffect, useState, useCallback } from "react";
import PlantaoBootSplash from "@/components/plantao/PlantaoBootSplash";

type Loaded = { default: React.ComponentType };

const INTRO_SHOWN_KEY = 'plantao_intro_video_shown';

export default function PlantaoEntry() {
  const [LoadedPage, setLoadedPage] = useState<React.ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    // Only show intro video on first visit
    return !localStorage.getItem(INTRO_SHOWN_KEY);
  });
  const [introComplete, setIntroComplete] = useState(!showIntro);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const mod = (await import("./PlantaoHome")) as Loaded;
        if (!cancelled) setLoadedPage(() => mod.default);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    // Mark intro as shown
    localStorage.setItem(INTRO_SHOWN_KEY, '1');
    setIntroComplete(true);
  }, []);

  // If page loaded and intro complete, show the page
  if (LoadedPage && introComplete) {
    return <LoadedPage />;
  }

  // If page loaded but intro still playing, show intro
  if (LoadedPage && showIntro && !introComplete) {
    return (
      <PlantaoBootSplash
        showVideo={true}
        onComplete={handleIntroComplete}
        subtitle="Iniciando..."
      />
    );
  }

  // Still loading the page
  return (
    <PlantaoBootSplash
      showVideo={showIntro && !introComplete}
      onComplete={handleIntroComplete}
      subtitle={failed ? "Falha ao carregar. Tentando novamente…" : "Carregando..."}
    />
  );
}
