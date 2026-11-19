import { PageContainer } from '@shared/ui/PageContainer';

import { CategoryGrid } from './overview/CategoryGrid';
import { ReferenceIntro } from './overview/ReferenceIntro';

export function ReferenceView() {
  return (
    <PageContainer width="wide">
      <ReferenceIntro />
      <CategoryGrid />
    </PageContainer>
  );
}
