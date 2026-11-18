'use client';

import type { SyntheticEvent } from 'react';

import { useModalDialog } from '@shared/lib/useModalDialog';
import { Button } from '@shared/ui/Button';

import { styles } from './ConfirmDialog.styles';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = '확인', onConfirm }: ConfirmDialogProps) {
  const dialogRef = useModalDialog(open);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} onCancel={handleCancel}>
      <div className={styles.body}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
