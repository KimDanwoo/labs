'use client';

import { useState, type ReactNode } from 'react';

type ModalVariant = 'dialog' | 'sheet';

type ModalShellProps = {
  variant?: ModalVariant;
  onClose?: () => void;
  maxWidth?: string;
  className?: string;
  disableBackdropClose?: boolean;
  children: ReactNode | ((close: () => void) => ReactNode);
};

const CLOSE_ANIM_MS = 200;

const WRAPPER: Record<ModalVariant, string> = {
  dialog: 'fixed inset-0 z-50 flex items-center justify-center',
  sheet: 'fixed inset-0 z-50 flex items-end justify-center',
};

const PANEL: Record<ModalVariant, string> = {
  dialog: 'relative w-full modal-content mx-4',
  sheet: 'relative w-full modal-content rounded-t-3xl rounded-b-none',
};

const ENTER_ANIM: Record<ModalVariant, string> = {
  dialog: 'animate-scale-in',
  sheet: 'animate-slide-up',
};

const EXIT_ANIM: Record<ModalVariant, string> = {
  dialog: 'animate-scale-out',
  sheet: 'animate-slide-down',
};

const DEFAULT_MAX_WIDTH: Record<ModalVariant, string> = {
  dialog: 'max-w-sm',
  sheet: 'max-w-md',
};

export default function ModalShell({
  variant = 'dialog',
  onClose,
  maxWidth,
  className = '',
  disableBackdropClose = false,
  children,
}: ModalShellProps) {
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = () => {
    if (isClosing || !onClose) return;
    setIsClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  };

  const panelAnim = isClosing ? EXIT_ANIM[variant] : ENTER_ANIM[variant];
  const overlayAnim = isClosing ? 'animate-overlay-out' : 'animate-overlay-in';

  return (
    <div className={WRAPPER[variant]}>
      <div
        className={`absolute inset-0 modal-overlay ${overlayAnim}`}
        onClick={disableBackdropClose ? undefined : requestClose}
      />
      <div
        className={`${PANEL[variant]} ${panelAnim} ${maxWidth ?? DEFAULT_MAX_WIDTH[variant]} ${className}`}
      >
        {typeof children === 'function' ? children(requestClose) : children}
      </div>
    </div>
  );
}
