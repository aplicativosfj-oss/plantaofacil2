import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

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

    // Auto-play do vídeo (muted por padrão devido a políticas de autoplay)
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

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setHasInteracted(true);
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVideoClick = () => {
    if (!hasInteracted) {
      toggleMute();
    }
  };

  return (
    <AnimatePresence>
      {!isEnding && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          onClick={handleVideoClick}
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
          
          {/* Sound toggle button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute bottom-8 right-8 p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </motion.button>

          {/* Hint text */}
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
