import { motion } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

const AnimatedPlantaoLogo = () => {
  const { currentTheme, themeConfig } = usePlantaoTheme();

  // Theme-specific particle colors
  const getParticleColors = () => {
    switch (currentTheme) {
      case 'bombeiros':
        return ['#ef4444', '#f97316', '#fbbf24'];
      case 'samu':
        return ['#f59e0b', '#ef4444', '#fbbf24'];
      case 'policia':
        return ['#3b82f6', '#60a5fa', '#93c5fd'];
      case 'penitenciario':
        return ['#6b7280', '#9ca3af', '#d1d5db'];
      case 'transito':
        return ['#22c55e', '#84cc16', '#fbbf24'];
      case 'vigilancia':
        return ['#8b5cf6', '#a78bfa', '#c4b5fd'];
      case 'guarda_municipal':
        return ['#0ea5e9', '#38bdf8', '#7dd3fc'];
      default:
        return ['#3b82f6', '#60a5fa', '#93c5fd'];
    }
  };

  const colors = getParticleColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
      className="relative mb-3 text-center"
    >
      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)/0.3) 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating security ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-40 h-40 md:w-52 md:h-52" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} stopOpacity="0.5" />
              <stop offset="50%" stopColor={colors[1]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colors[2]} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="1"
            strokeDasharray="8 12"
          />
        </svg>
      </motion.div>

      {/* Counter-rotating inner ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-32 h-32 md:w-40 md:h-40" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -15, 0],
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo with hover effect */}
      <motion.div
        className="relative z-10"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.img 
          src={plantaoLogo} 
          alt="PlantãoPro" 
          className="relative h-24 md:h-32 w-auto object-contain mx-auto"
          style={{
            filter: 'drop-shadow(0 0 20px hsl(var(--primary)/0.5))',
          }}
          animate={{
            filter: [
              'drop-shadow(0 0 15px hsl(var(--primary)/0.3))',
              'drop-shadow(0 0 25px hsl(var(--primary)/0.6))',
              'drop-shadow(0 0 15px hsl(var(--primary)/0.3))',
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Title with animated underline */}
      <motion.h1 
        className="text-xl md:text-2xl font-display font-bold text-foreground tracking-wider mt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        PLANTÃO<span className="text-primary">PRO</span>
      </motion.h1>

      {/* Animated subtitle with typing effect */}
      <motion.div
        className="flex items-center justify-center gap-2 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ scaleX: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">
          {themeConfig.subtitle}
        </p>
        <motion.div
          className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ scaleX: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Theme icon badge */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-primary/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-sm">{themeConfig.icon}</span>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedPlantaoLogo;
