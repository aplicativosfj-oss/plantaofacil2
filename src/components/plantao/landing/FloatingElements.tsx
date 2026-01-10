import { motion } from 'framer-motion';
import { Shield, Star, Radio, Fingerprint, Zap, Target } from 'lucide-react';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';

const floatingIcons = [
  { Icon: Shield, delay: 0, x: '10%', y: '20%' },
  { Icon: Star, delay: 2, x: '85%', y: '15%' },
  { Icon: Radio, delay: 4, x: '15%', y: '75%' },
  { Icon: Fingerprint, delay: 1, x: '80%', y: '70%' },
  { Icon: Zap, delay: 3, x: '50%', y: '85%' },
  { Icon: Target, delay: 5, x: '90%', y: '45%' },
];

export const FloatingElements = () => {
  const { themeConfig } = usePlantaoTheme();
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.1, 0.25, 0.1],
            scale: [0.8, 1, 0.8],
            y: [0, -15, 0],
          }}
          transition={{
            delay: delay,
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className="w-6 h-6 text-primary/30" />
        </motion.div>
      ))}

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-16 h-16">
        <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="absolute top-0 left-0 h-8 w-px bg-gradient-to-b from-primary/50 to-transparent" />
      </div>
      
      <div className="absolute top-6 right-6 w-16 h-16">
        <div className="absolute top-0 right-0 w-8 h-px bg-gradient-to-l from-primary/50 to-transparent" />
        <div className="absolute top-0 right-0 h-8 w-px bg-gradient-to-b from-primary/50 to-transparent" />
      </div>
      
      <div className="absolute bottom-6 left-6 w-16 h-16">
        <div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 h-8 w-px bg-gradient-to-t from-primary/50 to-transparent" />
      </div>
      
      <div className="absolute bottom-6 right-6 w-16 h-16">
        <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-primary/50 to-transparent" />
        <div className="absolute bottom-0 right-0 h-8 w-px bg-gradient-to-t from-primary/50 to-transparent" />
      </div>
    </div>
  );
};

export default FloatingElements;
