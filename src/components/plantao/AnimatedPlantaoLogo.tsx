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
      {/* Electric pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-56 h-56 md:w-72 md:h-72 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, hsl(var(--primary)/0.3) 25%, transparent 50%, hsl(var(--primary)/0.2) 75%, transparent 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Secondary rotating ring - opposite direction */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-48 h-48 md:w-60 md:h-60 rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, hsl(var(--primary)/0.15) 0%, transparent 25%, hsl(var(--primary)/0.2) 50%, transparent 75%, hsl(var(--primary)/0.15) 100%)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Glowing orbs circling around */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-52 h-52 md:w-64 md:h-64"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-lg"
            style={{ boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)/0.5)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-lg"
            style={{ boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)/0.5)' }}
            animate={{ scale: [1.5, 1, 1.5], opacity: [1, 0.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Hexagonal frame effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg
          className="w-52 h-52 md:w-64 md:h-64"
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <motion.polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeDasharray="10,5"
            animate={{ strokeOpacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.svg>
      </div>

      {/* Radial pulse effect */}
      <motion.div
        className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)/0.3) 0%, hsl(var(--primary)/0.1) 40%, transparent 70%)',
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scan line effect */}
      <motion.div
        className="absolute w-48 h-0.5 pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary)/0.8) 50%, transparent 100%)',
        }}
        animate={{ 
          y: [-60, 60, -60],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo image with glow */}
      <motion.div className="relative z-10">
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.4) 0%, transparent 60%)',
            filter: 'blur(25px)',
          }}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src={plantaoLogo}
          alt="PlantãoPro"
          className="relative h-28 md:h-36 w-auto object-contain"
          style={{
            filter: 'drop-shadow(0 0 15px hsl(var(--primary)/0.5))',
          }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      </motion.div>

      {/* Title with glitch-like effect */}
      <motion.h1
        className="relative z-10 mt-4 text-2xl md:text-3xl font-bebas tracking-widest"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <motion.span 
          className="text-foreground"
          animate={{ 
            textShadow: [
              '0 0 0px transparent',
              '0 0 8px hsl(var(--primary)/0.5)',
              '0 0 0px transparent',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          PLANTÃO
        </motion.span>
        <motion.span 
          className="text-primary ml-1"
          animate={{ 
            textShadow: [
              '0 0 5px hsl(var(--primary)/0.8)',
              '0 0 15px hsl(var(--primary))',
              '0 0 5px hsl(var(--primary)/0.8)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          PRO
        </motion.span>
      </motion.h1>

      {/* Subtitle with animated lines */}
      <motion.div
        className="flex items-center gap-3 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <motion.span 
          className="w-10 h-px bg-gradient-to-r from-transparent via-primary/80 to-primary"
          animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs md:text-sm font-medium text-foreground/80 uppercase tracking-wide flex items-center gap-1.5">
          {themeConfig.emoji} {themeConfig.subtitle}
        </span>
        <motion.span 
          className="w-10 h-px bg-gradient-to-l from-transparent via-primary/80 to-primary"
          animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

    </motion.div>
  );
};

export default AnimatedPlantaoLogo;
