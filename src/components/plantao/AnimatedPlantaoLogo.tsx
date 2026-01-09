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
      {/* Outer ring - subtle rotating glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-52 h-52 md:w-64 md:h-64 rounded-full border border-primary/20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.08) 0%, transparent 70%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Inner ring with dashed border */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-44 h-44 md:w-56 md:h-56 rounded-full"
          style={{
            border: '1px dashed hsl(var(--primary)/0.3)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Soft pulsing glow behind logo */}
      <motion.div
        className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)/0.25) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Corner brackets - elegant and proportional */}
      <div className="absolute w-48 h-48 md:w-60 md:h-60 pointer-events-none">
        <motion.span
          className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-primary/50 rounded-tl-sm"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.span
          className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-primary/50 rounded-tr-sm"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.span
          className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-primary/50 rounded-bl-sm"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.span
          className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-primary/50 rounded-br-sm"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
      </div>

      {/* Logo image */}
      <motion.img
        src={plantaoLogo}
        alt="PlantãoPro"
        className="relative z-10 h-28 md:h-36 w-auto object-contain drop-shadow-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      />

      {/* Title */}
      <motion.h1
        className="relative z-10 mt-4 text-2xl md:text-3xl font-bebas tracking-widest"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <span className="text-foreground">PLANTÃO</span>
        <motion.span
          className="text-primary ml-1"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          PRO
        </motion.span>
      </motion.h1>

      {/* Subtitle with lines */}
      <motion.div
        className="flex items-center gap-3 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <span className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
        <span className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          {themeConfig.emoji} {themeConfig.subtitle}
        </span>
        <span className="w-8 h-px bg-gradient-to-l from-transparent to-primary/50" />
      </motion.div>

    </motion.div>
  );
};

export default AnimatedPlantaoLogo;
