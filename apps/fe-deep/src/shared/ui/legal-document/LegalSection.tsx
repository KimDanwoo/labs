import { cn } from '@shared/lib/cn';

export interface LegalSectionContent {
  title: string;
  paragraph?: string;
  items?: readonly string[];
}

export function LegalSection({ title, paragraph, items }: LegalSectionContent) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {paragraph && <p>{paragraph}</p>}
      {items && (
        <ul className={cn('list-disc pl-5 space-y-1', paragraph && 'mt-2')}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
