import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoSplashProps {
  onComplete: () => void;
}

const VideoSplash = ({ onComplete }: VideoSplashProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play do vídeo
    video.play().catch(() => {
      // Se autoplay falhar, pula direto
      onComplete();
    });

    const handleEnded = () => {
      setIsEnding(true);
      setTimeout(onComplete, 500);
    };

    const handleError = () => {
      onComplete();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  // Permite pular tocando na tela
  const handleSkip = () => {
    setIsEnding(true);
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {!isEnding && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={handleSkip}
        >
          <video
            ref={videoRef}
            src="/video/intro-splash.mp4"
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />
          
          {/* Botão de pular discreto */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 }}
            onClick={handleSkip}
            className="absolute bottom-8 right-8 px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/60 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            Pular
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSplash;
