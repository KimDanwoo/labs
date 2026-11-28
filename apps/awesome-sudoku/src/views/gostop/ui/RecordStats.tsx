import { RECORD_COPY } from '@views/gostop/config/copy';
import { RECORD_FIELDS } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { MoneyRecord } from '@views/gostop/ui/MoneyRecord';

export function RecordStats() {
  const { record } = useGostopContext();

  return (
    <div className="grid w-full max-w-[340px] gap-1 rounded-2xl bg-weak p-2">
      <dl aria-label={RECORD_COPY.title} className="grid grid-cols-6 gap-1 text-center">
        {RECORD_FIELDS.map((field) => (
          <div key={field} className="min-w-0">
            <dt className="text-[12px] font-semibold text-text-tertiary break-keep">{RECORD_COPY[field]}</dt>
            <dd className="text-[17px] font-extrabold text-text-primary tabular-nums">{record[field]}</dd>
          </div>
        ))}
      </dl>
      <MoneyRecord />
    </div>
  );
}
