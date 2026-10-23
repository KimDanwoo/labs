import { useEffect, useRef } from 'react';

/** Mirrors a declarative `isOpen` onto a native modal dialog. */
export function useModal(isOpen: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);
  return ref;
}
