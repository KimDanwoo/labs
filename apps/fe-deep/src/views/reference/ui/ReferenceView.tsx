import { PageContainer } from '@shared/ui/PageContainer';

import { CategoryGrid } from '@views/reference/ui/overview/CategoryGrid';
import { ReferenceIntro } from '@views/reference/ui/overview/ReferenceIntro';

export function ReferenceView() {
  return (
    <PageContainer width="wide">
      <ReferenceIntro />
      <CategoryGrid />
    </PageContainer>
  );
}
