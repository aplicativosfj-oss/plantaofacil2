import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import plantaoLogo from "@/assets/plantao-pro-logo-new.png";

type Props = {
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  /** Mantido por compatibilidade; a intro em vídeo foi removida (força bruta). */
  showVideo?: boolean;
};

export default function PlantaoBootSplash({
  title = "PLANTÃO PRO",
  subtitle = "Carregando…",
  onComplete,
}: Props) {
  useEffect(() => {
    if (!onComplete) return;
    const t = setTimeout(() => onComplete(), 500);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-background text-foreground">
      {/* Fundo leve (sem imagem) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, hsl(var(--primary)/0.18) 0%, transparent 55%), radial-gradient(circle at 15% 85%, hsl(var(--accent)/0.12) 0%, transparent 50%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.img
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          src={plantaoLogo}
          alt="Plantão Pro"
          className="h-14 w-auto mb-5"
          loading="eager"
          decoding="async"
        />

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bebas tracking-wider"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mt-1 text-sm text-muted-foreground"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-5 flex items-center justify-center gap-2"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Aguarde…</span>
        </motion.div>
      </div>
    </main>
  );
}
