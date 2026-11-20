import { GAME_CONFIRM_BUTTON_VARIANT } from '@entities/sudoku/config/gameConfirm';
import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

interface GameConfirmButtonProps {
  variant: keyof typeof GAME_CONFIRM_BUTTON_VARIANT;
  onClick: () => void;
  children: ReactNode;
}

export function GameConfirmButton({ variant, onClick, children }: GameConfirmButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-12 rounded-xl text-base font-semibold transition-all duration-200 ease-out active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        GAME_CONFIRM_BUTTON_VARIANT[variant],
      )}
    >
      {children}
    </button>
  );
}
