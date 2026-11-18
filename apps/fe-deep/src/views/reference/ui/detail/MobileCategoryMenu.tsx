import { Menu } from 'lucide-react';

import type { Category } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';

import { CategorySidebar } from '../CategorySidebar';
import { styles } from './ReferenceDetailView.styles';

interface MobileCategoryMenuProps {
  categories: Category[];
}

export function MobileCategoryMenu({ categories }: MobileCategoryMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild className={styles.menuTrigger}>
        <Button variant="outline" size="icon" aria-label="카테고리 메뉴 열기" className={styles.menuButton}>
          <Menu className={styles.menuIcon} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={styles.menuContent}>
        <SheetTitle className="sr-only">카테고리 목록</SheetTitle>
        <div className={styles.menuBody}>
          <CategorySidebar categories={categories} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
