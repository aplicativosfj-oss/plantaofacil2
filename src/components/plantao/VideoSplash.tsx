import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoSplashProps {
  onComplete: () => void;
}

const VideoSplash = ({ onComplete }: VideoSplashProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const hasCompletedRef = useRef(false);

  // Garantir que onComplete só seja chamado uma vez
  const completeOnce = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsEnding(true);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    
    // Timeout de segurança - se demorar mais de 8 segundos, pular
    const safetyTimeout = setTimeout(() => {
      completeOnce();
    }, 8000);
    
    if (!video) {
      completeOnce();
      return () => clearTimeout(safetyTimeout);
    }

    const handleEnded = () => completeOnce();
    const handleError = () => completeOnce();
    const handleCanPlay = () => {
      // Vídeo pronto para reproduzir
      video.play().catch(() => completeOnce());
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Tentar reproduzir imediatamente (se já carregado)
    if (video.readyState >= 3) {
      video.play().catch(() => completeOnce());
    }

    return () => {
      clearTimeout(safetyTimeout);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [completeOnce]);

  const enableSoundOnce = () => {
    if (hasInteracted) return;
    const video = videoRef.current;
    if (!video) return;

    setHasInteracted(true);
    video.muted = false;
    video.volume = 1;
    setIsMuted(false);
  };

  const handleSkip = () => {
    completeOnce();
  };

  return (
    <AnimatePresence>
      {!isEnding && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          onClick={enableSoundOnce}
        >
          <video
            ref={videoRef}
            src="/video/intro-splash.mp4"
            className="w-full h-full object-contain sm:object-cover cursor-pointer"
            muted={isMuted}
            playsInline
            autoPlay
            preload="auto"
          />

          {/* Skip button - sempre visível */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium transition-colors"
          >
            Pular
          </button>

          {/* Hint text */}
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium"
            >
              Toque para ativar o som
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSplash;

