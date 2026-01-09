import { motion } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

const AnimatedPlantaoLogo = () => {
  const { themeConfig } = usePlantaoTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative mb-6 flex flex-col items-center"
    >
      {/* Simple glow ring - static, no animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-56 h-56 md:w-72 md:h-72 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Logo image with subtle glow */}
      <div className="relative z-10">
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.3) 0%, transparent 60%)',
            filter: 'blur(20px)',
          }}
        />
        <motion.img
          src={plantaoLogo}
          alt="PlantãoPro"
          className="relative h-28 md:h-36 w-auto object-contain"
          style={{
            filter: 'drop-shadow(0 0 10px hsl(var(--primary)/0.4))',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Title */}
      <motion.h1
        className="relative z-10 mt-4 text-2xl md:text-3xl font-bebas tracking-widest"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <span className="text-foreground">PLANTÃO</span>
        <span 
          className="text-primary ml-1"
          style={{ textShadow: '0 0 8px hsl(var(--primary)/0.6)' }}
        >
          PRO
        </span>
      </motion.h1>

      {/* Subtitle with static lines */}
      <motion.div
        className="flex items-center gap-3 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <span className="w-10 h-px bg-gradient-to-r from-transparent via-primary/60 to-primary" />
        <span className="text-xs md:text-sm font-medium text-foreground/80 uppercase tracking-wide flex items-center gap-1.5">
          {themeConfig.emoji} {themeConfig.subtitle}
        </span>
        <span className="w-10 h-px bg-gradient-to-l from-transparent via-primary/60 to-primary" />
      </motion.div>
    </motion.div>
  );
};

export default AnimatedPlantaoLogo;
