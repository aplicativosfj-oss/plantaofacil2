import { Loader2 } from "lucide-react";
import plantaoHomeBg from "@/assets/plantao-home-bg.jpeg";
import plantaoLogo from "@/assets/plantao-pro-logo-new.png";

type Props = {
  title?: string;
  subtitle?: string;
};

export default function PlantaoBootSplash({
  title = "PLANTÃO PRO",
  subtitle = "Carregando…",
}: Props) {
  return (
    <main
      className="min-h-screen w-full relative overflow-hidden bg-background text-foreground"
      style={{
        backgroundImage: `url(${plantaoHomeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <img
          src={plantaoLogo}
          alt="Plantão Pro"
          className="h-14 w-auto mb-5"
          loading="eager"
          decoding="async"
        />
        <h1 className="text-3xl font-bebas tracking-wider">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Aguarde…</span>
        </div>
      </div>
    </main>
  );
}
