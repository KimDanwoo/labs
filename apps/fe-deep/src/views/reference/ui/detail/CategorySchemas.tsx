import type { Category, Question } from '@entities/question';
import { SITE_URL } from '@shared/config/site';

import { buildBreadcrumbSchema, buildFaqSchema } from '@views/reference/lib/structuredData';
import { JsonLdScript } from '@views/reference/ui/detail/JsonLdScript';

interface CategorySchemasProps {
  category: Category;
  firstPage: Question[];
}

export function CategorySchemas({ category, firstPage }: CategorySchemasProps) {
  const faqSchema = buildFaqSchema(firstPage);
  return (
    <>
      {faqSchema && <JsonLdScript data={faqSchema} />}
      <JsonLdScript data={buildBreadcrumbSchema(SITE_URL, category)} />
    </>
  );
}
