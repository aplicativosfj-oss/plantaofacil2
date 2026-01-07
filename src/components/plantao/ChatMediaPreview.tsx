import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, FileText, Image as ImageIcon, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPreviewItem {
  type: 'audio' | 'image' | 'document';
  url: string;
  duration?: number;
  fileName?: string;
}

interface ChatMediaPreviewProps {
  items: MediaPreviewItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

const AudioPreview: React.FC<{ url: string; duration?: number; onRemove: () => void }> = ({ 
  url, 
  duration, 
  onRemove 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-2"
    >
      <audio 
        ref={audioRef} 
        src={url} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-primary"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      <Volume2 className="w-4 h-4 text-primary" />
      <span className="text-xs font-mono text-primary">{formatDuration(duration)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </motion.div>
  );
};

const ImagePreview: React.FC<{ url: string; onRemove: () => void }> = ({ url, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
    >
      <img src={url} alt="Preview" className="w-full h-full object-cover" />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 h-5 w-5 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </motion.div>
  );
};

const DocumentPreview: React.FC<{ fileName: string; onRemove: () => void }> = ({ 
  fileName, 
  onRemove 
}) => {
  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const baseName = name.slice(0, maxLength - (ext?.length || 0) - 4);
    return `${baseName}...${ext}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2"
    >
      <FileText className="w-5 h-5 text-blue-500" />
      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
        {truncateName(fileName)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </motion.div>
  );
};

const ChatMediaPreview: React.FC<ChatMediaPreviewProps> = ({ items, onRemove, onClear }) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg mb-2">
      <AnimatePresence>
        {items.map((item, index) => {
          switch (item.type) {
            case 'audio':
              return (
                <AudioPreview 
                  key={`audio-${index}`}
                  url={item.url} 
                  duration={item.duration}
                  onRemove={() => onRemove(index)} 
                />
              );
            case 'image':
              return (
                <ImagePreview 
                  key={`image-${index}`}
                  url={item.url} 
                  onRemove={() => onRemove(index)} 
                />
              );
            case 'document':
              return (
                <DocumentPreview 
                  key={`doc-${index}`}
                  fileName={item.fileName || 'documento'}
                  onRemove={() => onRemove(index)} 
                />
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
      
      {items.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          Limpar tudo
        </Button>
      )}
    </div>
  );
};

export default ChatMediaPreview;
