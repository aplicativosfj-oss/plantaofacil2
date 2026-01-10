import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

export const BrandSection = () => {
  const { themeConfig } = usePlantaoTheme();
  const MainIcon = themeConfig.mainIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-center mb-8"
    >
      {/* Logo container with glow effect */}
      <motion.div
        className="relative inline-flex items-center justify-center mb-6"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-150" />
        
        {/* Logo image or fallback icon */}
        <div className="relative">
          <motion.div
            className="relative w-32 h-32 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            {/* Animated ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border border-primary/20" />
            
            {/* Logo or Icon */}
            <img 
              src={plantaoLogo} 
              alt="PlantãoPro" 
              className="w-24 h-24 object-contain relative z-10"
              onError={(e) => {
                // Fallback to icon if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Brand text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="text-3xl font-display tracking-wider text-white mb-2">
          PLANTÃO<span className="text-primary">PRO</span>
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">
          {themeConfig.slogan}
        </p>
      </motion.div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-emerald-500"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-medium text-emerald-400 tracking-wider">SISTEMA ONLINE</span>
      </motion.div>
    </motion.div>
  );
};

export default BrandSection;
