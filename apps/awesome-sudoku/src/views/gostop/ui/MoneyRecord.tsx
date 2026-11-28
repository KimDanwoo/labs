import { MONEY_COPY } from '@views/gostop/config/copy';
import { MONEY_RECORD_FIELDS } from '@views/gostop/config/purse';
import { formatMoney } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function MoneyRecord() {
  const { wallet } = useGostopContext();

  return (
    <dl
      aria-label={MONEY_COPY.purse}
      className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 border-t border-border-light pt-1 text-[12px]"
    >
      {MONEY_RECORD_FIELDS.map((field) => (
        <div key={field.key} className="flex items-baseline gap-1.5">
          <dt className="font-semibold text-text-tertiary">{field.label}</dt>
          <dd className="text-[13px] font-extrabold text-text-primary tabular-nums">
            {formatMoney(wallet[field.key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
