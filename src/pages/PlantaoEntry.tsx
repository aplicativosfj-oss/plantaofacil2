import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Loaded = { default: React.ComponentType };

export default function PlantaoEntry() {
  const [LoadedPage, setLoadedPage] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Carrega a tela completa em background (sem bloquear o first paint)
    import("./PlantaoHome")
      .then((mod: Loaded) => {
        if (!cancelled) setLoadedPage(() => mod.default);
      })
      .catch(() => {
        // Se falhar, mantém fallback leve
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (LoadedPage) return <LoadedPage />;

  // Fallback ultra-leve: renderiza instantaneamente
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <h1 className="text-3xl font-bebas tracking-wider">PLANTÃO PRO</h1>
          <p className="text-sm text-muted-foreground">Abrindo</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </main>
  );
}
