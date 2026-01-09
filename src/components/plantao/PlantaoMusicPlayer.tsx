import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const MUSIC_TRACKS = [
  '/audio/background-music.mp3',
  '/audio/background-lento.mp3',
  '/audio/background-80.mp3',
];

const STORAGE_KEY = 'plantao_music_enabled';
const VOLUME_KEY = 'plantao_music_volume';

export default function PlantaoMusicPlayer() {
  const [isEnabled, setIsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem(VOLUME_KEY);
    return stored ? parseFloat(stored) : 0.3;
  });
  const [showControls, setShowControls] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_TRACKS[0]);
      audioRef.current.loop = false;
      audioRef.current.volume = volume;
      
      // When track ends, play next
      audioRef.current.addEventListener('ended', () => {
        setCurrentTrackIndex(prev => (prev + 1) % MUSIC_TRACKS.length);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Change track when index changes
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = MUSIC_TRACKS[currentTrackIndex];
      audioRef.current.volume = volume;
      if (wasPlaying && isEnabled) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrackIndex]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem(VOLUME_KEY, volume.toString());
  }, [volume]);

  // Handle enable/disable
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, isEnabled.toString());
    
    if (!isEnabled && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isEnabled]);

  const togglePlay = () => {
    if (!audioRef.current || !isEnabled) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // User interaction needed
      });
    }
  };

  const toggleEnabled = () => {
    setIsEnabled(prev => !prev);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-12 left-0 bg-card/95 border border-border/50 rounded-xl p-3 shadow-xl min-w-[180px]"
          >
            <div className="space-y-3">
              {/* Volume Control */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume</span>
                <Slider
                  value={[volume * 100]}
                  onValueChange={([v]) => setVolume(v / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={!isEnabled}
                />
              </div>
              
              {/* Play/Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  disabled={!isEnabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isEnabled 
                      ? 'bg-primary/20 hover:bg-primary/30 text-primary' 
                      : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Tocar
                    </>
                  )}
                </button>
              </div>
              
              {/* Enable/Disable Toggle */}
              <button
                onClick={toggleEnabled}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isEnabled 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                }`}
              >
                {isEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    Música Ativada
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    Música Desativada
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setShowControls(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative p-3 rounded-xl shadow-lg transition-all duration-300 ${
          isEnabled && isPlaying
            ? 'bg-primary/20 border border-primary/40 text-primary'
            : isEnabled
            ? 'bg-card/80 border border-border/50 text-foreground/70'
            : 'bg-muted/50 border border-border/30 text-muted-foreground/50'
        }`}
      >
        <Music className="w-5 h-5" />
        
        {/* Playing indicator */}
        {isPlaying && isEnabled && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        
        {/* Disabled indicator */}
        {!isEnabled && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </motion.button>
    </div>
  );
}
