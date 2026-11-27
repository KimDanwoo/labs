'use client';

import { cn } from '@shared/lib/cn';
import { BACKDROP_TRANSITION, PHASE, sheetMotion } from '@shared/ui/bottom-sheet/sheetMotion';
import { useBodyScrollLock } from '@shared/ui/bottom-sheet/useBodyScrollLock';
import { useFocusTrap } from '@shared/ui/bottom-sheet/useFocusTrap';
import { useIsDesktop } from '@shared/ui/bottom-sheet/useIsDesktop';
import { useSheetDrag } from '@shared/ui/bottom-sheet/useSheetDrag';
import { useSheetPhase } from '@shared/ui/bottom-sheet/useSheetPhase';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
        className="absolute inset-0 bg-black/50"
        style={{ opacity: isShown ? 1 : 0, transition: BACKDROP_TRANSITION }}
        onClick={close}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'absolute max-h-[85vh] bg-surface-elevated',
          isDesktop ? 'left-1/2 top-1/2 w-full max-w-md rounded-3xl' : 'bottom-0 left-0 right-0 rounded-t-3xl',
          className,
        )}
        style={sheetStyle}
      >
        {!isDesktop && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
            {...dragHandlers}
          >
            <div className="w-10 h-1.5 rounded-full bg-border-medium" />
          </div>
        )}
        {title && (
          <div
            id={titleId}
            className={cn(
              'px-6 text-xl font-extrabold tracking-[-0.03em]',
              isDesktop ? 'pt-6 pb-3' : 'py-3',
              'text-text-primary',
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
