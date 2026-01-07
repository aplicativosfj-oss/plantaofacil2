import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoSplashProps {
  onComplete: () => void;
}

const VideoSplash = ({ onComplete }: VideoSplashProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay começa mudo (política do navegador). Ao primeiro toque, liberamos som.
    video.play().catch(() => {
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

  const enableSoundOnce = () => {
    if (hasInteracted) return;
    const video = videoRef.current;
    if (!video) return;

    setHasInteracted(true);
    video.muted = false;
    video.volume = 1;
    setIsMuted(false);
  };

  return (
    <AnimatePresence>
      {!isEnding && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
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
            webkit-playsinline="true"
          />

          {/* Hint text (sem botões de pular / silenciar) */}
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
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

