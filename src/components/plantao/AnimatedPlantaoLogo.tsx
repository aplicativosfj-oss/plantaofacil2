import { motion } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';
import { Shield } from 'lucide-react';

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
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
      className="relative mb-4 text-center"
    >
      {/* Pulsing radar waves effect */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: colors[i % colors.length],
            width: '120px',
            height: '120px',
          }}
          animate={{
            scale: [1, 2.5, 3],
            opacity: [0.6, 0.2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Hexagon grid pattern effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`hex-${i}`}
            className="absolute"
            style={{
              width: '40px',
              height: '40px',
              left: `${30 + (i % 3) * 20}%`,
              top: `${25 + Math.floor(i / 3) * 35}%`,
            }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon
                points="20,2 38,12 38,28 20,38 2,28 2,12"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Corner brackets animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2" style={{ borderColor: colors[0] }} />
        <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2" style={{ borderColor: colors[1] }} />
        <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2" style={{ borderColor: colors[1] }} />
        <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2" style={{ borderColor: colors[0] }} />
      </motion.div>

      {/* Glowing dots effect */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const radius = 85;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={`dot-${i}`}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full pointer-events-none"
            style={{
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 8px ${colors[i % colors.length]}`,
              x: x,
              y: y,
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Main glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)/0.4) 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

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

      {/* Animated subtitle */}
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
