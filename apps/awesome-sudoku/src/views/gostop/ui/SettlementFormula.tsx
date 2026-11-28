import { cappedNote, settlementLine } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function SettlementFormula() {
  const { settlement } = useGostopContext();
  if (!settlement) return null;
  const line = settlementLine(settlement);
  const note = cappedNote(line, settlement.amount);

  return (
    <>
      <span className="font-extrabold whitespace-nowrap">{line.formula}</span>
      {note && <span className="w-full text-right text-[12px] text-text-tertiary break-keep">{note}</span>}
    </>
  );
}
