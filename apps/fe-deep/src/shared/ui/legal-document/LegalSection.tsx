import { cn } from '@shared/lib/cn';

import { styles } from './LegalDocument.styles';

export interface LegalSectionContent {
  title: string;
  paragraph?: string;
  items?: readonly string[];
}

export function LegalSection({ title, paragraph, items }: LegalSectionContent) {
  return (
    <section>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {paragraph && <p>{paragraph}</p>}
      {items && (
        <ul className={cn(styles.list.base, paragraph && styles.list.afterParagraph)}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
