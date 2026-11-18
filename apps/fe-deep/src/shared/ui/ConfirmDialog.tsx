'use client';

import type { SyntheticEvent } from 'react';

import { useModalDialog } from '@shared/lib/useModalDialog';
import { Button } from '@shared/ui/Button';

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
    <dialog
      ref={dialogRef}
      className="m-auto backdrop:bg-black/50 rounded-lg p-0 border shadow-lg max-w-[24rem] w-[calc(100%-2rem)] bg-background text-foreground"
      onCancel={handleCancel}
    >
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="flex justify-end">
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
