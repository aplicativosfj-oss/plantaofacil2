import { motion } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';
import { Shield, Radio, Siren, Lock, Fingerprint, Eye, Crosshair } from 'lucide-react';

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

  // Security icons for decoration
  const SecurityIcons = [Shield, Radio, Siren, Lock, Fingerprint, Eye, Crosshair];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
      className="relative mb-4 text-center"
    >
      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)/0.4) 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating security ring - outer */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-52 h-52 md:w-64 md:h-64" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} stopOpacity="0.6" />
              <stop offset="50%" stopColor={colors[1]} stopOpacity="0.4" />
              <stop offset="100%" stopColor={colors[2]} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="1.5"
            strokeDasharray="8 12"
          />
        </svg>
      </motion.div>

      {/* Counter-rotating inner ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-44 h-44 md:w-52 md:h-52" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.5"
          />
        </svg>
      </motion.div>

      {/* Security icons orbiting */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {SecurityIcons.map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              width: '180px',
              height: '180px',
            }}
          >
            <motion.div
              className="absolute"
              style={{
                top: '0%',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            >
              <Icon 
                className="w-4 h-4" 
                style={{ color: colors[i % colors.length] }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Floating particles with enhanced effects */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
            boxShadow: `0 0 10px ${colors[i % colors.length]}`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 15 - 7.5, 0],
            opacity: [0.3, 0.9, 0.3],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo with enhanced effects - BIGGER SIZE */}
      <motion.div
        className="relative z-10"
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <motion.img 
          src={plantaoLogo} 
          alt="PlantãoPro" 
          className="relative h-36 md:h-44 w-auto object-contain mx-auto"
          style={{
            filter: 'drop-shadow(0 0 30px hsl(var(--primary)/0.6))',
          }}
          animate={{
            filter: [
              'drop-shadow(0 0 20px hsl(var(--primary)/0.4))',
              'drop-shadow(0 0 40px hsl(var(--primary)/0.8))',
              'drop-shadow(0 0 20px hsl(var(--primary)/0.4))',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Title with security animation effects */}
      <motion.div
        className="relative mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Scanning line effect on title */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ borderRadius: '4px' }}
        >
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
        </motion.div>
        
        <motion.h1 
          className="text-2xl md:text-3xl font-display font-bold tracking-wider relative"
          animate={{
            textShadow: [
              '0 0 10px hsl(var(--primary)/0.3)',
              '0 0 20px hsl(var(--primary)/0.6)',
              '0 0 10px hsl(var(--primary)/0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span
            className="inline-block text-foreground"
            animate={{
              opacity: [1, 0.8, 1],
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            PLANTÃO
          </motion.span>
          <motion.span 
            className="inline-block text-primary"
            animate={{
              scale: [1, 1.05, 1],
              textShadow: [
                '0 0 5px hsl(var(--primary)/0.5)',
                '0 0 15px hsl(var(--primary)/0.9)',
                '0 0 5px hsl(var(--primary)/0.5)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            PRO
          </motion.span>
        </motion.h1>

        {/* Security shield pulse behind title */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="w-16 h-16 text-primary" />
        </motion.div>
      </motion.div>

      {/* Animated subtitle with typing effect */}
      <motion.div
        className="flex items-center justify-center gap-2 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="w-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.p 
          className="text-muted-foreground text-[11px] font-mono uppercase tracking-widest"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {themeConfig.subtitle}
        </motion.p>
        <motion.div
          className="w-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Theme icon badge */}
      <motion.div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-primary/40 shadow-lg shadow-primary/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.1 }}
      >
        <motion.span 
          className="text-lg"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {themeConfig.icon}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedPlantaoLogo;
