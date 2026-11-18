import { Bookmark } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';

import { styles } from './BookmarksPage.styles';

export function EmptyBookmarks() {
  return (
    <Card className={styles.empty}>
      <div className={styles.emptyIcon}>
        <Bookmark className={styles.emptyGlyph} />
      </div>
      <p className={styles.emptyText}>아직 북마크한 질문이 없습니다.</p>
      <Button variant="link" className={styles.emptyLink} asChild>
        <Link href="/reference">레퍼런스에서 질문 북마크하기 →</Link>
      </Button>
    </Card>
  );
}
