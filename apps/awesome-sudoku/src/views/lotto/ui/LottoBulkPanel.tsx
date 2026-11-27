import type { ToggleEvent } from 'react';

import { LOTTO_COPY } from '@views/lotto/config/copy';
import { BULK_TICKET_PRESETS } from '@views/lotto/config/lotto';
import { BULK_PANEL_CLASS } from '@views/lotto/config/style';
import { LottoBulkOption } from '@views/lotto/ui/LottoBulkOption';

interface LottoBulkPanelProps {
  id: string;
}

export function LottoBulkPanel({ id }: LottoBulkPanelProps) {
  const titleId = `${id}-title`;

  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const isOpening = event.newState === 'open';
    if (isOpening) event.currentTarget.querySelector('button')?.focus();
  };

  return (
    <div
      id={id}
      popover="auto"
      role="dialog"
      aria-labelledby={titleId}
      onToggle={handleToggle}
      className={BULK_PANEL_CLASS}
    >
      <p id={titleId} className="pb-4 text-xl font-extrabold tracking-[-0.03em] text-text-primary">
        {LOTTO_COPY.bulkPanelTitle}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {BULK_TICKET_PRESETS.map((count) => (
          <LottoBulkOption key={count} count={count} panelId={id} />
        ))}
      </div>
    </div>
  );
}
