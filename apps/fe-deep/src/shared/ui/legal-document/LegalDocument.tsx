import { styles } from './LegalDocument.styles';
import { LegalSection, type LegalSectionContent } from './LegalSection';

export interface LegalDocumentContent {
  title: string;
  effectiveDate: string;
  sections: readonly LegalSectionContent[];
}

export function LegalDocument({ title, effectiveDate, sections }: LegalDocumentContent) {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.body}>
        <p className={styles.effectiveDate}>{effectiveDate}</p>
        {sections.map((section) => (
          <LegalSection key={section.title} {...section} />
        ))}
      </div>
    </div>
  );
}
