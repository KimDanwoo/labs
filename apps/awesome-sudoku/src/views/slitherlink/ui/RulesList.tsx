import { SLITHERLINK_RULES } from '@views/slitherlink/config/copy';

export function RulesList() {
  return (
    <ol className="space-y-2.5">
      {SLITHERLINK_RULES.map((rule, index) => (
        <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary break-keep">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent-text"
          >
            {index + 1}
          </span>
          {rule}
        </li>
      ))}
    </ol>
  );
}
