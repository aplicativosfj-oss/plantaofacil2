import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { usePlantaoEffects } from '@/hooks/usePlantaoEffects';
import { 
  Shield, Star, Target, Crosshair, Flame, Siren, Truck, AlertTriangle,
  Ambulance, HeartPulse, Stethoscope, Activity, Lock, KeyRound, ShieldAlert,
  Car, Route, CircleAlert, Eye, Radar, ScanEye, Cctv, Building2, UserRoundCheck, 
  MapPin, BadgeCheck, Ban, CheckCircle, Fingerprint, Zap, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map for dynamic usage
const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Star, Target, Crosshair, Flame, Siren, Truck, AlertTriangle,
  Ambulance, HeartPulse, Stethoscope, Activity, Lock, KeyRound, ShieldAlert,
  Car, Route, CircleAlert, Eye, Radar, ScanEye, Cctv, Building2, UserRoundCheck, 
  MapPin, BadgeCheck, Zap
};

interface TeamData {
  value: 'alfa' | 'bravo' | 'charlie' | 'delta';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  subtitle: string;
}

interface StyledTeamButtonProps {
  team: TeamData;
  index: number;
  isUserTeam: boolean;
  isBlocked: boolean;
  isBlockedClicked: boolean;
  isAutoLogging: boolean;
  onTeamClick: (value: 'alfa' | 'bravo' | 'charlie' | 'delta') => void;
}

const StyledTeamButton = ({ 
  team, 
  index, 
  isUserTeam, 
  isBlocked, 
  isBlockedClicked, 
  isAutoLogging, 
  onTeamClick 
}: StyledTeamButtonProps) => {
  const { themeConfig, playSound, soundEnabled } = usePlantaoTheme();
  const { effectsEnabled } = usePlantaoEffects();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [showGlow, setShowGlow] = useState(false);
  
  // Get team icon from theme
  const iconName = themeConfig.teamIcons[team.value];
  const TeamIcon = ICON_MAP[iconName] || Shield;

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isBlocked || isAutoLogging) return;

    // Play click sound
    if (soundEnabled) {
      playSound('click');
    }

    // Visual effects
    if (effectsEnabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };
      
      setRipples(prev => [...prev, newRipple]);
      setIsPressed(true);
      setShowGlow(true);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 700);

      setTimeout(() => setIsPressed(false), 120);
      setTimeout(() => setShowGlow(false), 300);
    }

    onTeamClick(team.value);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
        x: isBlockedClicked ? [0, -4, 4, -4, 4, 0] : 0,
      }}
      transition={{ 
        delay: 0.15 + index * 0.08,
        type: 'spring',
        stiffness: 400,
        damping: 25,
        x: isBlockedClicked ? { duration: 0.35 } : undefined,
      }}
      whileHover={!isBlocked ? { 
        scale: 1.04, 
        y: -3,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      } : undefined}
      whileTap={!isBlocked ? { scale: 0.96 } : undefined}
      onClick={handlePress}
      disabled={isAutoLogging}
      className={cn(
        'relative px-4 py-3.5 rounded-2xl text-left overflow-hidden group',
        'border-2 transition-all duration-300',
        isBlockedClicked && 'ring-2 ring-red-500/50',
        isBlocked 
          ? 'opacity-40 cursor-not-allowed border-muted/30' 
          : 'cursor-pointer border-white/10 hover:border-primary/50',
        isUserTeam && 'ring-2 ring-primary shadow-xl shadow-primary/30 border-primary/60'
      )}
      style={{
        background: isBlocked 
          ? 'linear-gradient(135deg, hsl(var(--muted)/0.3), hsl(var(--muted)/0.1))'
          : `linear-gradient(135deg, hsl(var(--card)/0.9) 0%, hsl(var(--card)/0.6) 100%)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Ambient glow effect on press */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'absolute inset-0 rounded-2xl pointer-events-none',
              `bg-gradient-to-r ${team.color}`
            )}
            style={{ filter: 'blur(20px)' }}
          />
        )}
      </AnimatePresence>

      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ left: ripple.x, top: ripple.y }}
            className={cn(
              'absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none',
              `bg-gradient-to-r ${team.color}`
            )}
          />
        ))}
      </AnimatePresence>

      {/* Press flash effect */}
      <motion.div
        initial={false}
        animate={{ 
          opacity: isPressed ? 0.4 : 0,
          scale: isPressed ? 1.05 : 1
        }}
        transition={{ duration: 0.1 }}
        className={cn(
          'absolute inset-0 rounded-2xl pointer-events-none',
          `bg-gradient-to-br ${team.color}`
        )}
      />

      {/* Left gradient bar with pulse animation */}
      <motion.div 
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl',
          `bg-gradient-to-b ${team.color}`
        )}
        animate={{ 
          width: isPressed ? '6px' : '6px',
          opacity: isUserTeam ? [0.8, 1, 0.8] : 0.9
        }}
        transition={{ 
          opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
      />

      {/* Blocked overlay with shake feedback */}
      {isBlockedClicked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-red-500/30 pointer-events-none rounded-2xl"
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-3 pl-3 relative z-10">
        {/* Icon container with animated background */}
        <motion.div 
          className={cn(
            'relative p-2.5 rounded-xl shadow-lg',
            isBlocked 
              ? 'bg-muted/20' 
              : `bg-gradient-to-br ${team.color}`
          )}
          animate={{ 
            scale: isPressed ? 0.85 : 1,
            rotate: isPressed ? -8 : 0
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          {/* Icon glow ring */}
          {isUserTeam && !isBlocked && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 hsl(var(--primary)/0.4)',
                  '0 0 0 6px hsl(var(--primary)/0)',
                  '0 0 0 0 hsl(var(--primary)/0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {isBlocked ? (
            <Ban className="w-5 h-5 text-muted-foreground/50" />
          ) : isUserTeam ? (
            <Fingerprint className="w-5 h-5 text-white drop-shadow-lg" />
          ) : (
            <TeamIcon className="w-5 h-5 text-white drop-shadow-lg" />
          )}
        </motion.div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <motion.span 
            className={cn(
              'font-bold text-sm block tracking-wide',
              isBlocked ? 'text-muted-foreground/50' : 'text-foreground'
            )}
            animate={{ x: isPressed ? 3 : 0 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {team.label}
          </motion.span>
          <span className={cn(
            'text-[10px] font-mono uppercase tracking-widest',
            isBlocked ? 'text-red-400/40' : 'text-muted-foreground/70'
          )}>
            {isUserTeam ? (
              <span className="flex items-center gap-1">
                <motion.span 
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Online
              </span>
            ) : isBlocked ? 'Bloqueado' : team.subtitle}
          </span>
        </div>

        {/* User team checkmark */}
        {isUserTeam && (
          <motion.div
            animate={{ 
              scale: isPressed ? 1.3 : 1,
              rotate: isPressed ? 10 : 0
            }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      {/* Shimmer effect for user team */}
      {isUserTeam && (
        <motion.div 
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        >
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
        </motion.div>
      )}

      {/* Hover gradient overlay */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          `bg-gradient-to-t from-transparent via-transparent to-white/5`
        )}
      />

      {/* Corner accent on hover */}
      <motion.div
        className={cn(
          'absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none',
          `bg-gradient-to-br ${team.color}`
        )}
      />
    </motion.button>
  );
};

export default StyledTeamButton;
