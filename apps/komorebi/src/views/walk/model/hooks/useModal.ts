import { useEffect, useRef } from 'react';

export function useModal(isOpen: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const shouldOpen = isOpen && !dialog.open;
    if (shouldOpen) dialog.showModal();
    const shouldClose = !isOpen && dialog.open;
    if (shouldClose) dialog.close();
  }, [isOpen]);
  return ref;
}
