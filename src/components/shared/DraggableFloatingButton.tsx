import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface DraggableFloatingButtonProps {
  children: React.ReactNode;
  storageKey: string;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

const DraggableFloatingButton: React.FC<DraggableFloatingButtonProps> = memo(({
  children,
  storageKey,
  defaultPosition = { x: 16, y: 80 },
  onClose,
  className = '',
  showCloseButton = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ right: defaultPosition.x, bottom: defaultPosition.y });
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; right: number; bottom: number } | null>(null);

  // Calculate safe bounds with margins
  const getSafeBounds = useCallback(() => {
    const minMargin = 16;
    const maxRight = window.innerWidth - 80;
    const maxBottom = window.innerHeight - 80;
    // Ensure controls don't go above viewport - minimum 50px from top
    const minBottom = 50;
    return { minMargin, maxRight, maxBottom, minBottom };
  }, []);

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`floatingPos_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const bounds = getSafeBounds();
        setPosition({
          right: Math.max(bounds.minMargin, Math.min(bounds.maxRight, parsed.right ?? defaultPosition.x)),
          bottom: Math.max(bounds.minBottom, Math.min(bounds.maxBottom, parsed.bottom ?? defaultPosition.y)),
        });
      }
    } catch {
      // Ignore errors
    }
  }, [storageKey, defaultPosition, getSafeBounds]);

  // Save position
  const savePosition = useCallback((pos: { right: number; bottom: number }) => {
    try {
      localStorage.setItem(`floatingPos_${storageKey}`, JSON.stringify(pos));
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  // Handle drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setShowControls(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      right: position.right,
      bottom: position.bottom,
    };
  }, [position]);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current || !isDragging) return;

    const deltaX = dragStartRef.current.x - clientX;
    const deltaY = dragStartRef.current.y - clientY;
    const bounds = getSafeBounds();

    const newRight = Math.max(bounds.minMargin, Math.min(bounds.maxRight, dragStartRef.current.right + deltaX));
    const newBottom = Math.max(bounds.minBottom, Math.min(bounds.maxBottom, dragStartRef.current.bottom + deltaY));

    setPosition({ right: newRight, bottom: newBottom });
  }, [isDragging, getSafeBounds]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      savePosition(position);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  }, [isDragging, position, savePosition]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  }, [handleDragStart]);

  // Global move/end listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Hide controls after timeout
  useEffect(() => {
    if (showControls && !isDragging) {
      const timer = setTimeout(() => setShowControls(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showControls, isDragging]);

  // Determine if widget is near top of screen (controls should go below instead)
  const isNearTop = position.bottom > window.innerHeight - 120;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`fixed z-50 touch-none select-none ${className}`}
      style={{
        right: position.right,
        bottom: position.bottom,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isDragging && setShowControls(false)}
    >
      {/* Container with controls */}
      <div className="relative">
        {/* Floating controls - positioned dynamically to avoid going off-screen */}
        <motion.div
          initial={false}
          animate={{
            opacity: showControls || isDragging ? 1 : 0,
            scale: showControls || isDragging ? 1 : 0.9,
            y: showControls || isDragging ? 0 : (isNearTop ? 5 : -5),
          }}
          transition={{ duration: 0.15 }}
          className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-full px-2 py-1 shadow-lg ${
            showControls || isDragging ? '' : 'pointer-events-none'
          } ${isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        >
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
          >
            <GripVertical size={14} />
          </div>
          
          {/* Close button */}
          {showCloseButton && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Children content - also draggable */}
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`transition-opacity duration-100 ${isDragging ? 'opacity-80' : 'opacity-100'}`}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
});

DraggableFloatingButton.displayName = 'DraggableFloatingButton';

export default DraggableFloatingButton;
