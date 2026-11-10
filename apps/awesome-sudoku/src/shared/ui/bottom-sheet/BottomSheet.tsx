'use client';

import { cn } from '@shared/lib/cn';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BACKDROP_TRANSITION, PHASE, sheetMotion } from './sheetMotion';
import { useBodyScrollLock } from './useBodyScrollLock';
import { useFocusTrap } from './useFocusTrap';
import { useIsDesktop } from './useIsDesktop';
import { useSheetDrag } from './useSheetDrag';
import { useSheetPhase } from './useSheetPhase';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
};

export function BottomSheet({ isOpen, onClose, children, title, className }: BottomSheetProps) {
  const titleId = useId();
  const isDesktop = useIsDesktop();
  const sheetRef = useRef<HTMLDivElement>(null);

  const { phase, close } = useSheetPhase({ isOpen, onClose, sheetRef, isDesktop });
  const isMounted = phase !== PHASE.idle;
  const isShown = phase === PHASE.opening || phase === PHASE.open;

  useBodyScrollLock(isMounted);
  useFocusTrap({ containerRef: sheetRef, isActive: isMounted, onEscape: close });
  const dragHandlers = useSheetDrag({ sheetRef, isDraggable: isShown, onDismiss: close });

  if (!isMounted) return null;

  const motion = sheetMotion(isDesktop);
  const sheetStyle = {
    ...(isShown ? motion.shown : motion.hidden),
    transition: motion.transition,
    willChange: motion.willChange,
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ opacity: isShown ? 1 : 0, transition: BACKDROP_TRANSITION }}
        onClick={close}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'absolute bg-[rgb(var(--color-surface-primary))]',
          'shadow-xl max-h-[85vh]',
          isDesktop ? 'left-1/2 top-1/2 rounded-2xl w-full max-w-md' : 'bottom-0 left-0 right-0 rounded-t-2xl',
          className,
        )}
        style={sheetStyle}
      >
        {!isDesktop && (
          <div
            className={cn(
              'flex justify-center pt-3 pb-2',
              'cursor-grab active:cursor-grabbing',
              'touch-none select-none',
            )}
            {...dragHandlers}
          >
            <div className={cn('w-10 h-1.5 rounded-full', 'bg-[rgb(var(--color-border-medium))]')} />
          </div>
        )}
        {title && (
          <div
            id={titleId}
            className={cn(
              'px-6 text-lg font-bold',
              isDesktop ? 'pt-6 pb-3' : 'py-3',
              'text-[rgb(var(--color-text-primary))]',
            )}
          >
            {title}
          </div>
        )}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
