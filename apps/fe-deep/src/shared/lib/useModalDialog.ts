import { useEffect, useRef } from 'react';

export function useModalDialog(isOpen: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const shouldOpen = isOpen && !dialog.open;
    const shouldClose = !isOpen && dialog.open;
    if (shouldOpen) dialog.showModal();
    if (shouldClose) dialog.close();
  }, [isOpen]);

  return dialogRef;
}
