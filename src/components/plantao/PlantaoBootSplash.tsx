import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import plantaoHomeBg from "@/assets/plantao-home-bg.jpeg";
import plantaoLogo from "@/assets/plantao-pro-logo-new.png";

type Props = {
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  showVideo?: boolean;
};

export default function PlantaoBootSplash({
  title = "PLANTÃO PRO",
  subtitle = "Carregando…",
  onComplete,
  showVideo = true,
}: Props) {
  const [videoEnded, setVideoEnded] = useState(!showVideo);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // If video already ended or there's an error, call onComplete
    if (videoEnded || videoError) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [videoEnded, videoError, onComplete]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setVideoEnded(true);
  };

  const handleSkipVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoEnded(true);
  };

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-black text-foreground">
      <AnimatePresence mode="wait">
        {showVideo && !videoEnded && !videoError ? (
          <motion.div
            key="video"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              className="w-full h-full object-cover"
            >
              <source src="/video/intro-plantao.mp4" type="video/mp4" />
            </video>
            
            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleSkipVideo}
              className="absolute bottom-8 right-8 px-4 py-2 text-sm text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-all duration-300 border border-white/10"
            >
              Pular Intro
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${plantaoHomeBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={plantaoLogo}
                alt="Plantão Pro"
                className="h-14 w-auto mb-5"
                loading="eager"
                decoding="async"
              />
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bebas tracking-wider"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-1 text-sm text-muted-foreground"
              >
                {subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5 flex items-center justify-center gap-2"
              >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Aguarde…</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
