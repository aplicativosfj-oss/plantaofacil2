import { motion } from 'framer-motion';
import { Volume2, VolumeX, Palette, RotateCcw, Crown, Sparkles } from 'lucide-react';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { usePlantaoEffects } from '@/hooks/usePlantaoEffects';
import { useGlobalSound } from '@/hooks/useGlobalSound';
import ThemeSelector from '@/components/plantao/ThemeSelector';

interface PremiumHeaderProps {
  hasSavedCredentials: boolean;
  onResetCredentials: () => void;
  onMasterLogin: () => void;
  onAboutOpen: () => void;
}

export const PremiumHeader = ({
  hasSavedCredentials,
  onResetCredentials,
  onMasterLogin,
  onAboutOpen,
}: PremiumHeaderProps) => {
  const { themeConfig } = usePlantaoTheme();
  const { soundEnabled, toggleSound } = usePlantaoEffects();
  const { playClick } = useGlobalSound();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-20 px-4 py-4"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          {/* Left section - Theme badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary/80">{themeConfig.emoji} {themeConfig.name}</span>
            </div>
          </motion.div>

          {/* Right section - Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Sound toggle */}
            <motion.button
              onClick={() => {
                toggleSound();
                if (!soundEnabled) playClick();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${soundEnabled 
                  ? 'bg-primary/15 text-primary border border-primary/30' 
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'}
              `}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>

            {/* Theme selector */}
            <ThemeSelector
              trigger={
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={playClick}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/50 hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  <Palette className="w-4 h-4" />
                </motion.button>
              }
            />

            {/* Reset credentials */}
            {hasSavedCredentials && (
              <motion.button
                onClick={() => {
                  playClick();
                  onResetCredentials();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/50 hover:border-red-500/30 hover:text-red-400 transition-all duration-200"
                title="Limpar acesso salvo"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}

            {/* Master login */}
            <motion.button
              onClick={() => {
                playClick();
                onMasterLogin();
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all duration-200"
            >
              <Crown className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default PremiumHeader;
