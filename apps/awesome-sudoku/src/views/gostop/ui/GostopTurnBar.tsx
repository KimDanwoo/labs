import { DeckPile } from '@views/gostop/ui/DeckPile';
import { TurnLog } from '@views/gostop/ui/TurnLog';

export function GostopTurnBar() {
  return (
    <div aria-live="polite" className="flex min-h-11 items-center gap-2 px-1">
      <DeckPile />
      <TurnLog />
    </div>
  );
}
