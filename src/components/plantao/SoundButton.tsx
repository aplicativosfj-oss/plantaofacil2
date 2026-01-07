import { forwardRef, useCallback } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import useClickSound from '@/hooks/useClickSound';

export interface SoundButtonProps extends ButtonProps {
  enableSound?: boolean;
}

const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onClick, enableSound = true, children, ...props }, ref) => {
    const { playClick } = useClickSound();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (enableSound) {
          playClick();
        }
        if (onClick) {
          onClick(e);
        }
      },
      [enableSound, onClick, playClick]
    );

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

SoundButton.displayName = 'SoundButton';

export { SoundButton };
export default SoundButton;
