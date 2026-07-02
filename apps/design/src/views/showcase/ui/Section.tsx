import type { ReactNode } from 'react';

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
