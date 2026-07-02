'use client';

import { cn } from '@shared/model/utils';
import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

type Phase = 'idle' | 'mounted' | 'opening' | 'open' | 'closing';

const CLOSE_THRESHOLD = 0.35;
const VELOCITY_THRESHOLD = 500;
const ANIMATION_MS = 500;
const SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const MD_BREAKPOINT = '(min-width: 768px)';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MD_BREAKPOINT).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MD_BREAKPOINT);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

export const BottomSheet = memo<BottomSheetProps>(({ isOpen, onClose, children, title, className }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const mounted = phase !== 'idle';
  const titleId = useId();
  const isDesktop = useIsDesktop();

  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const dragState = useRef({
    isDragging: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
    sheetHeight: 0,
  });

  // ── isOpen 전이 — 렌더 중 상태 보정으로 mount/close 트리거 ──
  const [prevOpen, setPrevOpen] = useState(false);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen && phase === 'idle') setPhase('mounted');
    if (!isOpen && phase !== 'idle' && phase !== 'closing') setPhase('closing');
  }

  const close = useCallback(() => {
    setPhase((p) => (p === 'idle' || p === 'closing' ? p : 'closing'));
  }, []);

  // mounted: 이전 포커스 기억 + 강제 reflow 후 다음 프레임에 opening
  useLayoutEffect(() => {
    if (phase !== 'mounted') return undefined;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const el = sheetRef.current;
    if (el) el.getBoundingClientRect();
    const id = requestAnimationFrame(() => setPhase('opening'));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  // opening → open
  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const id = setTimeout(() => setPhase('open'), ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // closing: 닫힘 스타일 적용(드래그로 transition이 꺼진 경우 복구) → 애니메이션 후 unmount
  useEffect(() => {
    if (phase !== 'closing') return undefined;
    const el = sheetRef.current;
    if (el) {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}, opacity ${ANIMATION_MS}ms ${SPRING}`;
      if (isDesktop) {
        el.style.transform = 'translate(-50%, -50%) scale(0.95)';
        el.style.opacity = '0';
      } else {
        el.style.transform = 'translateY(100%)';
      }
    }
    const id = setTimeout(() => {
      setPhase('idle');
      onCloseRef.current();
      previousFocusRef.current?.focus();
    }, ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phase, isDesktop]);

  // Body scroll lock
  useEffect(() => {
    if (!mounted) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mounted]);

  // Escape key + Focus trap
  useEffect(() => {
    if (!mounted) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab') {
        const el = sheetRef.current;
        if (!el) return;
        const focusable = el.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea,' + ' [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mounted, close]);

  // ── Drag Handlers (mobile only) ──
  const onDragStart = useCallback(
    (clientY: number) => {
      if (phase !== 'open' && phase !== 'opening') return;
      const el = sheetRef.current;
      if (!el) return;
      el.style.transition = 'none';
      dragState.current = {
        isDragging: true,
        startY: clientY,
        currentY: clientY,
        startTime: Date.now(),
        sheetHeight: el.offsetHeight,
      };
    },
    [phase],
  );

  const onDragMove = useCallback((clientY: number) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.currentY = clientY;
    const deltaY = Math.max(0, clientY - ds.startY);
    const el = sheetRef.current;
    if (el) el.style.transform = `translateY(${deltaY}px)`;
  }, []);

  const onDragEnd = useCallback(() => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;

    const deltaY = Math.max(0, ds.currentY - ds.startY);
    const elapsed = Date.now() - ds.startTime;
    const velocity = (deltaY / elapsed) * 1000;
    const ratio = deltaY / ds.sheetHeight;
    const el = sheetRef.current;
    if (!el) return;

    const shouldClose = ratio > CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD;
    if (shouldClose) {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}`;
      el.style.transform = 'translateY(100%)';
      setPhase('closing');
    } else {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}`;
      el.style.transform = 'translateY(0)';
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onDragStart(e.clientY);
    },
    [onDragStart],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => onDragMove(e.clientY), [onDragMove]);

  const handlePointerUp = useCallback(() => onDragEnd(), [onDragEnd]);

  if (!mounted) return null;

  const isShown = phase === 'opening' || phase === 'open';

  const sheetStyle = isDesktop
    ? {
        transform: isShown ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
        opacity: isShown ? 1 : 0,
        transition: `transform ${ANIMATION_MS}ms ${SPRING},` + ` opacity ${ANIMATION_MS}ms ${SPRING}`,
        willChange: 'transform, opacity' as const,
      }
    : {
        transform: isShown ? 'translateY(0)' : 'translateY(100%)',
        transition: `transform ${ANIMATION_MS}ms ${SPRING}`,
        willChange: 'transform' as const,
      };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: isShown ? 1 : 0,
          transition: `opacity ${ANIMATION_MS}ms ${SPRING}`,
        }}
        onClick={close}
      />
      {/* Sheet */}
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
        {/* Drag handle (mobile only) */}
        {!isDesktop && (
          <div
            className={cn(
              'flex justify-center pt-3 pb-2',
              'cursor-grab active:cursor-grabbing',
              'touch-none select-none',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className={cn('w-10 h-1.5 rounded-full', 'bg-[rgb(var(--color-border-medium))]')} />
          </div>
        )}
        {/* Title */}
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
        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
});

BottomSheet.displayName = 'BottomSheet';
