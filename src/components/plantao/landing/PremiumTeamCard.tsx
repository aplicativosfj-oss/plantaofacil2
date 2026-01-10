import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Ban, Fingerprint, ChevronRight, Loader2 } from 'lucide-react';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { LucideIcon } from 'lucide-react';

interface TeamData {
  value: 'alfa' | 'bravo' | 'charlie' | 'delta';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  subtitle: string;
}

interface PremiumTeamCardProps {
  team: TeamData;
  index: number;
  isUserTeam: boolean;
  isBlocked: boolean;
  isBlockedClicked: boolean;
  isAutoLogging: boolean;
  userTeamLabel?: string;
  onTeamClick: (value: 'alfa' | 'bravo' | 'charlie' | 'delta') => void;
}

const getTeamGradient = (value: string) => {
  const gradients: Record<string, string> = {
    alfa: 'from-blue-500 via-blue-600 to-blue-700',
    bravo: 'from-amber-400 via-amber-500 to-orange-600',
    charlie: 'from-emerald-400 via-emerald-500 to-green-600',
    delta: 'from-red-400 via-red-500 to-rose-600',
  };
  return gradients[value] || gradients.alfa;
};

const getTeamGlow = (value: string) => {
  const glows: Record<string, string> = {
    alfa: 'shadow-blue-500/25',
    bravo: 'shadow-amber-500/25',
    charlie: 'shadow-emerald-500/25',
    delta: 'shadow-red-500/25',
  };
  return glows[value] || glows.alfa;
};

export const PremiumTeamCard = ({
  team,
  index,
  isUserTeam,
  isBlocked,
  isBlockedClicked,
  isAutoLogging,
  userTeamLabel,
  onTeamClick,
}: PremiumTeamCardProps) => {
  const { themeConfig, getTeamIcon, playSound } = usePlantaoTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const TeamIcon = getTeamIcon(team.value);
  const gradient = getTeamGradient(team.value);
  const glow = getTeamGlow(team.value);

  const handleClick = () => {
    if (isAutoLogging) return;
    playSound('click');
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onTeamClick(team.value);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        x: isBlockedClicked ? [0, -4, 4, -4, 4, 0] : 0,
      }}
      transition={{ 
        delay: 0.1 + index * 0.08,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        x: isBlockedClicked ? { duration: 0.4 } : undefined,
      }}
      whileHover={{ scale: isBlocked ? 1 : 1.02, y: isBlocked ? 0 : -4 }}
      whileTap={{ scale: isBlocked ? 1 : 0.98 }}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      disabled={isAutoLogging}
      className={`
        relative w-full overflow-hidden
        rounded-2xl p-[1px]
        transition-all duration-300
        ${isUserTeam ? `shadow-xl ${glow}` : 'shadow-lg shadow-black/20'}
        ${isBlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isBlockedClicked ? 'ring-2 ring-red-500' : ''}
      `}
    >
      {/* Gradient border */}
      <div className={`
        absolute inset-0 rounded-2xl
        bg-gradient-to-br ${gradient}
        opacity-${isUserTeam ? '100' : isHovered ? '60' : '30'}
        transition-opacity duration-300
      `} />

      {/* Card content */}
      <div className={`
        relative rounded-[15px] p-4
        bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95
        backdrop-blur-xl
        transition-all duration-300
        ${isHovered && !isBlocked ? 'from-slate-800/95 via-slate-800/90 to-slate-700/95' : ''}
      `}>
        {/* Shimmer effect for user's team */}
        {isUserTeam && (
          <motion.div
            className="absolute inset-0 rounded-[15px] overflow-hidden pointer-events-none"
            initial={false}
          >
            <motion.div
              className="absolute inset-0 -translate-x-full"
              animate={{ translateX: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>
          </motion.div>
        )}

        {/* Blocked click flash */}
        <AnimatePresence>
          {isBlockedClicked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-500 rounded-[15px]"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          {/* Icon container with gradient background */}
          <motion.div
            animate={{ 
              scale: isPressed ? 0.85 : 1,
              rotate: isPressed ? -10 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`
              relative p-3 rounded-xl
              bg-gradient-to-br ${gradient}
              shadow-lg ${glow}
            `}
          >
            {isBlocked ? (
              <Ban className="w-6 h-6 text-white/80" />
            ) : isUserTeam ? (
              <Fingerprint className="w-6 h-6 text-white" />
            ) : (
              <TeamIcon className="w-6 h-6 text-white" />
            )}
            
            {/* Pulse ring for user's team */}
            {isUserTeam && (
              <motion.div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient}`}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Text content */}
          <div className="flex-1 text-left min-w-0">
            <motion.h3
              className={`
                font-bold text-base tracking-wide
                ${isBlocked ? 'text-slate-500' : 'text-white'}
              `}
            >
              {team.label}
            </motion.h3>
            <p className={`
              text-xs uppercase tracking-wider
              ${isUserTeam ? 'text-emerald-400' : isBlocked ? 'text-red-400/60' : 'text-slate-400'}
            `}>
              {isUserTeam ? '● Conectado' : isBlocked ? `Bloqueado • ${userTeamLabel}` : team.subtitle}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center">
            {isAutoLogging && isUserTeam ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : isUserTeam ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </motion.div>
            ) : !isBlocked ? (
              <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isHovered ? 'translate-x-1 text-slate-300' : ''}`} />
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default PremiumTeamCard;
