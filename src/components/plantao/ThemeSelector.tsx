import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantaoTheme, PLANTAO_THEMES, PlantaoThemeType } from '@/contexts/PlantaoThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Volume2, VolumeX, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ThemeSelectorProps {
  trigger?: React.ReactNode;
}

const ThemeSelector = ({ trigger }: ThemeSelectorProps) => {
  const { currentTheme, setTheme, playSound, soundEnabled, setSoundEnabled } = usePlantaoTheme();
  const [open, setOpen] = React.useState(false);

  const handleSelectTheme = (themeId: PlantaoThemeType) => {
    setTheme(themeId);
    // Não toca som ao trocar tema
  };

  const themes = Object.values(PLANTAO_THEMES);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <Palette className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 text-xs">
              {PLANTAO_THEMES[currentTheme].icon}
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] p-0 overflow-hidden bg-gradient-to-b from-card to-background border-primary/20">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            Personalizar
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[65vh]">
          <div className="p-3 space-y-3">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${soundEnabled ? 'bg-primary/20' : 'bg-muted'}`}>
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <Label htmlFor="sound-toggle" className="text-xs">Sons</Label>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                className="scale-90"
              />
            </div>

            {/* Theme Grid - More compact and modern */}
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {themes.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  
                  return (
                    <motion.button
                      key={theme.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`
                        relative p-2 rounded-xl text-center transition-all duration-300
                        ${isSelected 
                          ? 'bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary shadow-lg shadow-primary/20' 
                          : 'bg-card/50 hover:bg-card border border-border/30 hover:border-primary/30'
                        }
                      `}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md"
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                      
                      {/* Theme icon */}
                      <div className="text-xl mb-1">{theme.icon}</div>
                      
                      {/* Theme name */}
                      <h3 className="font-medium text-[10px] leading-tight truncate">{theme.name}</h3>
                      
                      {/* Color dots */}
                      <div className="flex justify-center gap-0.5 mt-1.5">
                        <div 
                          className="w-2 h-2 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        />
                        <div 
                          className="w-2 h-2 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                        />
                        <div 
                          className="w-2 h-2 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: `hsl(${theme.colors.teamAlfa})` }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;
