import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';
import { NEW_GAME_ACTION_VARIANT } from '../../config/newGame';

interface NewGameActionButtonProps {
  variant: keyof typeof NEW_GAME_ACTION_VARIANT;
  onClick: () => void;
  children: ReactNode;
}

export function NewGameActionButton({ variant, onClick, children }: NewGameActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-12 rounded-xl text-base font-semibold transition-all duration-200 ease-out active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        NEW_GAME_ACTION_VARIANT[variant],
      )}
    >
      {children}
    </button>
  );
}
