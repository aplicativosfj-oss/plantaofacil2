import React, { useState } from 'react';
import { motion } from 'framer-motion';
import logoFreteRapido from '@/assets/logo-frete-rapido.png';

interface FreteAnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const FreteAnimatedLogo: React.FC<FreteAnimatedLogoProps> = ({ 
  size = 'md', 
  className = '',
  showGlow = true 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-20 h-auto sm:w-24',
    md: 'w-32 h-auto sm:w-40',
    lg: 'w-48 h-auto sm:w-56 md:w-64',
    xl: 'w-56 h-auto sm:w-64 md:w-80',
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isLoaded ? 1 : 0, 
        scale: isLoaded ? 1 : 0.8,
        filter: showGlow ? [
          'drop-shadow(0 0 10px hsl(24 100% 50%/0.4))',
          'drop-shadow(0 0 25px hsl(24 100% 50%/0.7))',
          'drop-shadow(0 0 10px hsl(24 100% 50%/0.4))',
        ] : 'none',
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        opacity: { duration: 0.3, repeat: 0 },
        scale: { duration: 0.3, repeat: 0 },
      }}
    >
      {/* Efeito de velocidade */}
      {showGlow && (
        <motion.div
          className="absolute -left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            x: [-10, 0, -10],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-8 h-1 bg-gradient-to-r from-orange-500/60 to-transparent rounded-full blur-sm" />
          <div className="w-6 h-1 bg-gradient-to-r from-orange-400/40 to-transparent rounded-full blur-sm mt-2" />
          <div className="w-10 h-1 bg-gradient-to-r from-orange-500/50 to-transparent rounded-full blur-sm mt-2" />
        </motion.div>
      )}

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className={`${sizeClasses[size]} aspect-video bg-muted/30 rounded-lg animate-pulse`} />
      )}
      
      <img
        src={logoFreteRapido}
        alt="Frete Rápido"
        className={`${sizeClasses[size]} object-contain ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </motion.div>
  );
};

export default FreteAnimatedLogo;
