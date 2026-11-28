import { RECORD_COPY } from '@views/gostop/config/copy';
import { recordLine } from '@views/gostop/lib/resultLines';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function ResultRecordLine() {
  const { record } = useGostopContext();

  return (
    <p className="mt-2.5 text-center text-[12px] font-semibold text-text-tertiary tabular-nums break-keep">
      <span className="mr-1.5 font-bold text-text-secondary">{RECORD_COPY.title}</span>
      {recordLine(record)}
    </p>
  );
}
