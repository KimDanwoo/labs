import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';
import { LegalSection, type LegalSectionContent } from '@shared/ui/legal-document/LegalSection';

export interface LegalDocumentContent {
  title: string;
  effectiveDate: string;
  sections: readonly LegalSectionContent[];
}

export function LegalDocument({ title, effectiveDate, sections }: LegalDocumentContent) {
  return (
    <PageContainer width="document">
      <PageTitle className="mb-8">{title}</PageTitle>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">{effectiveDate}</p>
        {sections.map((section) => (
          <LegalSection key={section.title} {...section} />
        ))}
      </div>
    </PageContainer>
  );
}
