import { Search } from 'lucide-react';

import { Card } from '@shared/ui/Card';

import { styles } from './SearchContent.styles';

export function EmptySearchPrompt() {
  return (
    <Card className={styles.emptyCard}>
      <div className={styles.emptyIcon}>
        <Search className={styles.emptyGlyph} />
      </div>
      <p className={styles.emptyText}>키워드를 입력하면 모든 질문과 답변에서 검색합니다.</p>
    </Card>
  );
}
