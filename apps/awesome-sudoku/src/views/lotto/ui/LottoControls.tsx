import { useId } from 'react';
import { LuDices, LuEraser, LuLayers, LuSparkles, LuTrophy } from 'react-icons/lu';

import { IconButton } from '@shared/ui/icon-button';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoBulkPanel } from '@views/lotto/ui/LottoBulkPanel';

export function LottoControls() {
  const { ticket, isTicketComplete, isSimulating, autoFill, clearTicket, drawOnce, runUntilJackpot } =
    useLottoContext();
  const bulkPanelId = useId();
  const isRunLocked = !isTicketComplete || isSimulating;
  const isClearLocked = ticket.length === 0 || isSimulating;

  const handleAutoFill = () => {
    if (isTicketComplete) clearTicket();
    autoFill();
  };

  return (
    <>
      <div className="grid w-full max-w-[408px] grid-cols-5 justify-items-center gap-2 md:gap-3">
        <IconButton.Root type="button" onClick={handleAutoFill} disabled={isSimulating}>
          <IconButton.Icon>
            <LuDices strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{LOTTO_COPY.autoFill}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" onClick={clearTicket} disabled={isClearLocked}>
          <IconButton.Icon>
            <LuEraser strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{LOTTO_COPY.clear}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" variant="primary" onClick={drawOnce} disabled={isRunLocked}>
          <IconButton.Icon>
            <LuSparkles strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{LOTTO_COPY.draw}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" aria-haspopup="dialog" popoverTarget={bulkPanelId} disabled={isRunLocked}>
          <IconButton.Icon>
            <LuLayers strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{LOTTO_COPY.bulk}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" onClick={runUntilJackpot} disabled={isRunLocked}>
          <IconButton.Icon>
            <LuTrophy strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{LOTTO_COPY.jackpot}</IconButton.Label>
        </IconButton.Root>
      </div>
      <LottoBulkPanel id={bulkPanelId} />
    </>
  );
}
