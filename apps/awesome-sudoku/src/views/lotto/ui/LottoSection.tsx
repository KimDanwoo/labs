import { useId, type ReactNode } from 'react';

interface LottoSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function LottoSection({ title, description, children }: LottoSectionProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="space-y-4 rounded-2xl border border-border-light bg-surface-primary p-4 shadow-sm shadow-black/3 sm:p-5"
    >
      <div className="space-y-1">
        <h2 id={titleId} className="text-base font-bold text-text-primary">
          {title}
        </h2>
        {description && <p className="text-xs leading-relaxed text-text-tertiary break-keep">{description}</p>}
      </div>
      {children}
    </section>
  );
}
