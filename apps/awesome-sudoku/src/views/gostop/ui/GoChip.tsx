import { BOARD_COPY, GO_CHIP_COPY, GOSTOP_COPY } from '@views/gostop/config/copy';
import { goTagOf } from '@views/gostop/lib/stopPreview';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';

interface GoChipProps {
  side: Side;
}

export function GoChip({ side }: GoChipProps) {
  const { preview, goCount } = useGostopContext();
  const chip = goTagOf(goCount[side], preview.stop[side]);

  if (!chip) {
    return (
      <>
        <dt className="sr-only">{BOARD_COPY.goBonus}</dt>
        <dd className="sr-only">{`0${GOSTOP_COPY.goUnit}`}</dd>
      </>
    );
  }

  return (
    <>
      <dt className="sr-only">{BOARD_COPY.goBonus}</dt>
      <dd className="inline-flex h-6 items-center gap-1 rounded-full bg-lemon/15 px-2 text-[12px] font-bold whitespace-nowrap text-lemon ring-1 ring-lemon/45">
        {`${chip.count}${GOSTOP_COPY.goUnit}`}
        <span aria-hidden="true" className="text-lemon/60">
          {GO_CHIP_COPY.separator}
        </span>
        <span className="font-semibold text-white/90">
          {`${GO_CHIP_COPY.stopPrefix} ${chip.stopPoints}${GOSTOP_COPY.points}`}
        </span>
      </dd>
    </>
  );
}
