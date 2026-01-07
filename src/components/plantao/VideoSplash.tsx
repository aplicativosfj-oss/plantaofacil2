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

  return (
    <AnimatePresence>
      {!isEnding && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
          <video
            ref={videoRef}
            src="/video/intro-splash.mp4"
            className="w-full h-full object-contain sm:object-cover"
            muted
            playsInline
            autoPlay
            webkit-playsinline="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSplash;
