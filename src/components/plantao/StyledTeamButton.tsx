import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { useGlobalSound } from '@/hooks/useGlobalSound';
import { 
  Shield, Star, Target, Crosshair, Flame, Siren, Truck, AlertTriangle,
  Ambulance, HeartPulse, Stethoscope, Activity, Lock, KeyRound, ShieldAlert,
  Car, Route, CircleAlert, Eye, Radar, ScanEye, Cctv, Building2, UserRoundCheck, 
  MapPin, BadgeCheck, Ban, CheckCircle, Fingerprint, Zap, Radio, LucideIcon, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map for dynamic usage
const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Star, Target, Crosshair, Flame, Siren, Truck, AlertTriangle,
  Ambulance, HeartPulse, Stethoscope, Activity, Lock, KeyRound, ShieldAlert,
  Car, Route, CircleAlert, Eye, Radar, ScanEye, Cctv, Building2, UserRoundCheck, 
  MapPin, BadgeCheck, Zap, Radio
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
  userTeamLabel?: string;
  onTeamClick: (value: 'alfa' | 'bravo' | 'charlie' | 'delta') => void;
}

// Security-themed visual effects for each team
const getTeamEffects = (teamValue: string) => {
  switch (teamValue) {
    case 'alfa':
      return {
        bgPattern: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
        accentColor: '#3b82f6',
        pulseColor: 'rgba(59, 130, 246, 0.4)',
        icon: Shield,
        effectType: 'shield', // Shield pulse effect
      };
    case 'bravo':
      return {
        bgPattern: 'radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)',
        accentColor: '#f59e0b',
        pulseColor: 'rgba(245, 158, 11, 0.4)',
        icon: Star,
        effectType: 'flash', // Flash/alert effect
      };
    case 'charlie':
      return {
        bgPattern: 'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)',
        accentColor: '#22c55e',
        pulseColor: 'rgba(34, 197, 94, 0.4)',
        icon: Target,
        effectType: 'radar', // Radar sweep effect
      };
    case 'delta':
      return {
        bgPattern: 'radial-gradient(circle at 100% 100%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
        accentColor: '#ef4444',
        pulseColor: 'rgba(239, 68, 68, 0.4)',
        icon: Crosshair,
        effectType: 'siren', // Siren/emergency effect
      };
    default:
      return {
        bgPattern: '',
        accentColor: '#3b82f6',
        pulseColor: 'rgba(59, 130, 246, 0.4)',
        icon: Shield,
        effectType: 'shield',
      };
  }
};

const StyledTeamButton = ({ 
  team, 
  index, 
  isUserTeam, 
  isBlocked, 
  isBlockedClicked, 
  isAutoLogging, 
  userTeamLabel,
  onTeamClick 
}: StyledTeamButtonProps) => {
  const { themeConfig } = usePlantaoTheme();
  const { playClick } = useGlobalSound();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [showGlow, setShowGlow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Get team icon from theme
  const teamIconData = themeConfig.teamIcons[team.value];
  const TeamIcon = teamIconData?.icon || Shield;
  const teamEffects = getTeamEffects(team.value);

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isBlocked || isAutoLogging) return;

    // Play click sound
    playClick();

    // Visual effects
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

    onTeamClick(team.value);
  };

  // Team-specific animated elements
  const renderTeamEffect = () => {
    if (!isHovered && !isUserTeam) return null;

    switch (teamEffects.effectType) {
      case 'shield':
        return (
          <motion.div
            className="absolute top-2 right-2 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  `0 0 0 0 ${teamEffects.pulseColor}`,
                  `0 0 0 8px transparent`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: teamEffects.accentColor + '20' }}
            >
              <Shield className="w-3 h-3" style={{ color: teamEffects.accentColor }} />
            </motion.div>
          </motion.div>
        );
      case 'flash':
        return (
          <motion.div
            className="absolute top-2 right-2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Zap className="w-4 h-4" style={{ color: teamEffects.accentColor }} />
            </motion.div>
          </motion.div>
        );
      case 'radar':
        return (
          <motion.div
            className="absolute top-2 right-2 pointer-events-none overflow-hidden w-6 h-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${teamEffects.accentColor}40 10%, transparent 20%)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <div 
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: teamEffects.accentColor + '40' }}
            />
          </motion.div>
        );
      case 'siren':
        return (
          <motion.div
            className="absolute top-2 right-2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ 
                backgroundColor: [teamEffects.accentColor + '40', teamEffects.accentColor + '80', teamEffects.accentColor + '40'],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-4 h-4 rounded-full flex items-center justify-center"
            >
              <Radio className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Show blocked message when blocked click happens
  const showMessage = isBlockedClicked && userTeamLabel;

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
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
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handlePress}
        disabled={isAutoLogging}
        className={cn(
          'relative px-4 py-3.5 rounded-2xl text-left overflow-hidden group w-full',
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
        {/* Team-specific background pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: teamEffects.bgPattern }}
        />

        {/* Team-specific animated effect */}
        <AnimatePresence>
          {renderTeamEffect()}
        </AnimatePresence>

        {/* Ambient glow effect on press */}
        <AnimatePresence>
          {showGlow && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ 
                background: `radial-gradient(circle, ${teamEffects.accentColor}40 0%, transparent 70%)`,
                filter: 'blur(20px)' 
              }}
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
              style={{ 
                left: ripple.x, 
                top: ripple.y,
                backgroundColor: teamEffects.accentColor,
              }}
              className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
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
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ backgroundColor: teamEffects.accentColor }}
        />

        {/* Left gradient bar with pulse animation */}
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
          style={{ backgroundColor: teamEffects.accentColor }}
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
            className="relative p-2.5 rounded-xl shadow-lg"
            style={{ backgroundColor: isBlocked ? 'hsl(var(--muted)/0.2)' : teamEffects.accentColor }}
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
                    `0 0 0 0 ${teamEffects.pulseColor}`,
                    `0 0 0 8px transparent`,
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
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `linear-gradient(to top, transparent, ${teamEffects.accentColor}10)`,
          }}
        />

        {/* Corner accent on hover */}
        <motion.div
          className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"
          style={{ backgroundColor: teamEffects.accentColor }}
        />
      </motion.button>

      {/* Professional blocked message popover */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-2 left-0 right-0',
              'bg-gradient-to-br from-card via-card to-card/95',
              'border border-amber-500/30 rounded-lg shadow-xl shadow-black/20',
              'backdrop-blur-xl overflow-hidden'
            )}
          >
            {/* Top accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
            
            <div className="p-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 shrink-0">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    Acesso restrito
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Você pertence à equipe{' '}
                    <span className="font-bold text-amber-400">{userTeamLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StyledTeamButton;
