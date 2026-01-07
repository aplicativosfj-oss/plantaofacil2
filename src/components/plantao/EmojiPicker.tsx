import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onPlaySound?: () => void;
}

const EMOJI_CATEGORIES = {
  'Rostos': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  'Gestos': ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '💪', '🦾'],
  'Objetos': ['📱', '💻', '🖥️', '📞', '☎️', '📟', '📠', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '🏆', '🎯', '🎮', '🎲'],
  'Símbolos': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '🔥', '💥', '🎉', '🎊', '✅', '❌', '⚠️', '🚨'],
  'Trabalho': ['👮', '🚔', '🚓', '🚨', '📋', '📊', '📈', '📉', '🗂️', '📁', '📂', '🗃️', '📝', '📎', '🖇️', '📐', '📏', '🔒', '🔓', '🔑', '🗝️', '⚙️', '🔧', '🔨', '⚡', '🎖️', '🏅'],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onPlaySound }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Rostos');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onPlaySound?.();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Smile className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-12 right-0 z-50 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">Emojis</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Categories */}
              <div className="flex gap-1 p-2 border-b border-border overflow-x-auto scrollbar-none">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                      activeCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emojis Grid */}
              <div className="p-2 h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
