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
    playSound('click');
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
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizar Tema
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <Label htmlFor="sound-toggle">Sons do Sistema</Label>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-2 gap-3">
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`
                        relative p-4 rounded-xl border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                          : 'border-border bg-card hover:border-primary/50'
                        }
                      `}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                      
                      {/* Theme icon */}
                      <div className="text-3xl mb-2">{theme.icon}</div>
                      
                      {/* Theme name */}
                      <h3 className="font-semibold text-sm">{theme.name}</h3>
                      <p className="text-xs text-muted-foreground">{theme.subtitle}</p>
                      
                      {/* Color preview */}
                      <div className="flex gap-1 mt-3">
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: `hsl(${theme.colors.teamAlfa})` }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: `hsl(${theme.colors.teamBravo})` }}
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
