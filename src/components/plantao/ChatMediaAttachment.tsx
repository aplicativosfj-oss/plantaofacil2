import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, FileText, Mic, MicOff, X, Send, Pause, Play, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMediaAttachmentProps {
  isRecording: boolean;
  recordingDuration: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
  disabled?: boolean;
}

const ChatMediaAttachment: React.FC<ChatMediaAttachmentProps> = ({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onPickImage,
  onPickDocument,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 bg-destructive/10 rounded-full px-3 py-1 mr-1"
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span className="text-xs font-mono text-destructive">{recordingDuration}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/20"
              onClick={onCancelRecording}
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/20"
              onClick={onStopRecording}
            >
              <Send className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Menu */}
      {!isRecording && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onPickImage} className="gap-2 cursor-pointer">
              <Image className="w-4 h-4 text-emerald-500" />
              <span>Enviar Imagem</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPickDocument} className="gap-2 cursor-pointer">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Enviar Documento</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Voice Recording Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`h-9 w-9 transition-colors ${
          isRecording 
            ? 'text-destructive animate-pulse bg-destructive/10' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        disabled={disabled}
      >
        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>
    </div>
  );
};

export default ChatMediaAttachment;
