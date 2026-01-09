import { useEffect, useState } from "react";
import PlantaoBootSplash from "@/components/plantao/PlantaoBootSplash";

type Loaded = { default: React.ComponentType };

export default function PlantaoEntry() {
  const [LoadedPage, setLoadedPage] = useState<React.ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

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

  if (LoadedPage) return <LoadedPage />;

  return (
    <PlantaoBootSplash
      subtitle={failed ? "Falha ao carregar. Tentando novamente…" : "Carregando a tela inicial…"}
    />
  );
}

