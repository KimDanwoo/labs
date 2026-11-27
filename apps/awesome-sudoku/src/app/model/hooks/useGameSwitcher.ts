'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useId, useRef } from 'react';

import { useOutsideDismiss } from '@app/model/hooks/useOutsideDismiss';
import { useRouteScopedOpen } from '@app/model/hooks/useRouteScopedOpen';
import { findGameByPath } from '@entities/game-catalog';

export function useGameSwitcher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useRouteScopedOpen(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const handleEscape = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [setIsOpen]);
  const handleToggle = useCallback(() => setIsOpen((wasOpen) => !wasOpen), [setIsOpen]);

  useOutsideDismiss({ rootRef: menuRef, isActive: isOpen, onOutside: handleClose, onEscape: handleEscape });

  return {
    currentGame: findGameByPath(pathname),
    isOpen,
    menuRef,
    triggerRef,
    panelId,
    handleClose,
    handleToggle,
  };
}

export type GameSwitcher = ReturnType<typeof useGameSwitcher>;
