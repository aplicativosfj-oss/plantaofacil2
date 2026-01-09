import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UsePlantaoEscapeBackOptions {
  /** Path to navigate to when ESC is pressed. If not provided, uses navigate(-1) */
  to?: string;
  /** Array of boolean states that, when true, will prevent ESC navigation (e.g., open dialogs) */
  disableWhen?: boolean[];
  /** Whether the hook is enabled. Default: true */
  enabled?: boolean;
  /** Optional callback for playing a sound */
  onEscape?: () => void;
}

/**
 * Hook that handles ESC key to navigate back in Plantão system.
 * Automatically navigates to the specified path or back.
 * 
 * @example
 * // Navigate to / when ESC is pressed
 * usePlantaoEscapeBack({ to: '/' });
 * 
 * @example
 * // Disable when a dialog is open
 * usePlantaoEscapeBack({ to: '/', disableWhen: [isDialogOpen, isConfirmOpen] });
 */
export function usePlantaoEscapeBack(options: UsePlantaoEscapeBackOptions = {}) {
  const navigate = useNavigate();
  const { to, disableWhen = [], enabled = true, onEscape } = options;

  const handleEscape = useCallback(() => {
    // Check if any blocking condition is true
    const isBlocked = disableWhen.some(condition => condition === true);
    if (isBlocked) return false;

    onEscape?.();
    
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
    return true;
  }, [navigate, to, disableWhen, onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      
      // Check if any blocking condition is true
      const isBlocked = disableWhen.some(condition => condition === true);
      if (isBlocked) return;

      e.preventDefault();
      handleEscape();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleEscape, disableWhen]);

  return { handleEscape };
}

export default usePlantaoEscapeBack;
