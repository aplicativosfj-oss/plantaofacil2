import { forwardRef, useCallback, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SoundButtonProps extends ButtonProps {
  enableSound?: boolean;
  enableRipple?: boolean;
}

const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onClick, enableSound = true, enableRipple = true, children, className, ...props }, ref) => {
    const { playSound, soundEnabled } = usePlantaoTheme();
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Play sound
        if (enableSound && soundEnabled) {
          playSound('click');
        }

        // Add ripple effect
        if (enableRipple) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const newRipple = { x, y, id: Date.now() };
          setRipples(prev => [...prev, newRipple]);
          setIsPressed(true);

          setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
          }, 600);

          setTimeout(() => setIsPressed(false), 100);
        }

        if (onClick) {
          onClick(e);
        }
      },
      [enableSound, enableRipple, onClick, playSound, soundEnabled]
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          isPressed && 'scale-95',
          className
        )}
        {...props}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ left: ripple.x, top: ripple.y }}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 pointer-events-none"
            />
          ))}
        </AnimatePresence>

        {/* Press flash */}
        <motion.div
          initial={false}
          animate={{
            opacity: isPressed ? 0.2 : 0,
          }}
          transition={{ duration: 0.1 }}
          className="absolute inset-0 bg-white pointer-events-none"
        />

        <span className="relative z-10">{children}</span>
      </Button>
    );
  }
);

SoundButton.displayName = 'SoundButton';

export { SoundButton };
export default SoundButton;
