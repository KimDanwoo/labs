import type { ReactNode } from 'react';

type ModalVariant = 'dialog' | 'sheet';

type ModalShellProps = {
  variant?: ModalVariant;
  onClose?: () => void;
  maxWidth?: string;
  className?: string;
  children: ReactNode;
};

const WRAPPER: Record<ModalVariant, string> = {
  dialog: 'fixed inset-0 z-50 flex items-center justify-center',
  sheet: 'fixed inset-0 z-50 flex items-end justify-center',
};

const PANEL: Record<ModalVariant, string> = {
  dialog: 'relative w-full modal-content mx-4 animate-scale-in',
  sheet:
    'relative w-full modal-content rounded-t-3xl rounded-b-none animate-slide-up',
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
  children,
}: ModalShellProps) {
  return (
    <div className={WRAPPER[variant]}>
      <div className="absolute inset-0 modal-overlay" onClick={onClose} />
      <div
        className={`${PANEL[variant]} ${maxWidth ?? DEFAULT_MAX_WIDTH[variant]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
