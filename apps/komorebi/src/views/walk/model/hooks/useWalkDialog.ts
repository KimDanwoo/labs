import { useState } from 'react';
import { flushSync } from 'react-dom';
import { DIALOG, type Dialog } from '../../config/walk';

export function useWalkDialog(isBusy: boolean, onFocusScene: () => void) {
  const [dialog, setDialog] = useState<Dialog>(DIALOG.none);

  function closeDialog(which: Dialog) {
    // Commit now: window-level shortcuts read this state and must not see a dialog the browser already closed.
    flushSync(() => setDialog((current) => (current === which ? DIALOG.none : current)));
    onFocusScene();
  }
  function closeAtlas() {
    closeDialog(dialog === DIALOG.journal ? DIALOG.journal : DIALOG.map);
  }
  function openDialog(next: Dialog) {
    if (!isBusy) setDialog(next);
  }

  return { dialog, setDialog, closeDialog, closeAtlas, openDialog };
}
