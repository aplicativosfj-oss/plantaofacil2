import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantaoTheme, PLANTAO_THEMES, PlantaoThemeType } from '@/contexts/PlantaoThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Volume2, VolumeX, Check, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ThemeSelectorProps {
  trigger?: React.ReactNode;
}

const ThemeSelector = ({ trigger }: ThemeSelectorProps) => {
  const { currentTheme, setTheme, soundEnabled, setSoundEnabled } = usePlantaoTheme();
  const [open, setOpen] = React.useState(false);

  const handleSelectTheme = (themeId: PlantaoThemeType) => {
    setTheme(themeId);
  };

  const themes = Object.values(PLANTAO_THEMES);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="relative p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Palette className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 text-xs">
              {PLANTAO_THEMES[currentTheme].emoji}
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-card via-card to-background border-primary/30 shadow-2xl">
        {/* Header com gradiente */}
        <DialogHeader className="relative p-5 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%)]" />
          <DialogTitle className="relative flex items-center gap-3 text-base">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <span className="font-display tracking-wide">Personalização</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Escolha o tema da sua corporação
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 space-y-4">
            {/* Sound Toggle - Redesenhado */}
            <motion.div 
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`p-2 rounded-lg ${soundEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                  animate={soundEnabled ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </motion.div>
                <div>
                  <Label htmlFor="sound-toggle" className="text-sm font-medium cursor-pointer">
                    Efeitos Sonoros
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Sons ao interagir</p>
                </div>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </motion.div>

            {/* Tema Atual - Destaque */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border border-primary/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative flex items-center gap-4">
                {(() => {
                  const currentConfig = PLANTAO_THEMES[currentTheme];
                  const MainIcon = currentConfig.mainIcon;
                  return (
                    <>
                      <motion.div
                        className={`p-4 rounded-2xl bg-gradient-to-br ${currentConfig.colors.gradient} shadow-lg`}
                        animate={{ 
                          boxShadow: [
                            '0 0 20px hsl(var(--primary)/0.3)',
                            '0 0 40px hsl(var(--primary)/0.5)',
                            '0 0 20px hsl(var(--primary)/0.3)',
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <MainIcon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{currentConfig.emoji}</span>
                          <h3 className={`font-display ${currentConfig.style.titleSize} tracking-wide text-foreground`}>
                            {currentConfig.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{currentConfig.subtitle}</p>
                        <p className="text-xs text-primary/80 font-mono mt-1">"{currentConfig.slogan}"</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Ícones decorativos do tema atual */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-primary/20">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Equipes:</span>
                <div className="flex items-center gap-3">
                  {(['alfa', 'bravo', 'charlie', 'delta'] as const).map((team) => {
                    const config = PLANTAO_THEMES[currentTheme];
                    const TeamIcon = config.teamIcons[team].icon;
                    const colorVar = team === 'alfa' ? '--team-alfa' : team === 'bravo' ? '--team-bravo' : team === 'charlie' ? '--team-charlie' : '--team-delta';
                    return (
                      <motion.div
                        key={team}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 border border-border/50"
                        whileHover={{ scale: 1.1 }}
                      >
                        <TeamIcon className="w-3.5 h-3.5" style={{ color: `hsl(var(${colorVar}))` }} />
                        <span className="text-[10px] font-medium uppercase">{team}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid de Temas - Layout profissional */}
            <div className="space-y-2">
              <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-mono px-1">
                Selecionar Tema
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence mode="popLayout">
                  {themes.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    const ThemeIcon = theme.mainIcon;
                    
                    return (
                      <motion.button
                        key={theme.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`
                          relative flex items-center gap-4 p-3 text-left transition-all duration-200
                          ${theme.style.borderRadius}
                          ${isSelected 
                            ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent ring-2 ring-primary shadow-lg shadow-primary/20' 
                            : 'bg-card/50 hover:bg-card border border-border/30 hover:border-primary/40'
                          }
                        `}
                      >
                        {/* Ícone principal do tema */}
                        <div className={`
                          relative p-3 ${theme.style.borderRadius}
                          ${isSelected 
                            ? `bg-gradient-to-br ${theme.colors.gradient}` 
                            : 'bg-muted/50'
                          }
                        `}>
                          <ThemeIcon className={`${theme.style.iconSize} ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                          
                          {/* Indicador de selecionado */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Info do tema */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{theme.emoji}</span>
                            <h3 className={`font-display text-sm tracking-wide ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {theme.name}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{theme.subtitle}</p>
                        </div>

                        {/* Preview dos ícones das equipes */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {(['alfa', 'bravo', 'charlie', 'delta'] as const).map((team, idx) => {
                            const TeamIcon = theme.teamIcons[team].icon;
                            return (
                              <motion.div
                                key={team}
                                className="p-1 rounded bg-background/50"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <TeamIcon className="w-3 h-3 text-muted-foreground" />
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Cores do tema */}
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full ring-1 ring-white/20 shadow-sm"
                            style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full ring-1 ring-white/20 shadow-sm"
                            style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer info */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] text-center text-muted-foreground">
                Cada tema possui ícones, cores e estilos exclusivos para sua corporação
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;
