import { CHOICE_SOURCE } from '@views/gostop/config/game';
import { without } from '@views/gostop/lib/cards';
import type { PendingPlay, Side, Table } from '@views/gostop/model/types/gostop';

export interface TableStage {
  table: Table;
  held: number | null;
  revealed: number | null;
}

export const liftedTable = (prev: Table, side: Side, card: number): Table => ({
  ...prev,
  hands: { ...prev.hands, [side]: without(prev.hands[side], [card]) },
});

export const playedTable = (prev: Table, side: Side, card: number): Table => {
  const lifted = liftedTable(prev, side, card);
  return { ...lifted, floor: [...lifted.floor, card] };
};

export const revealedTable = (table: Table): Table => ({ ...table, deck: table.deck.slice(1) });

export function choiceStage(table: Table, side: Side, pending: PendingPlay): TableStage {
  const { card, choice } = pending;
  if (choice.source === CHOICE_SOURCE.PLAYED)
    return { table: liftedTable(table, side, card), held: card, revealed: null };
  return { table: revealedTable(playedTable(table, side, card)), held: null, revealed: choice.card };
}
