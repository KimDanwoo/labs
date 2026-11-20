import { Menu } from 'lucide-react';

import type { Category } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';

import { CategorySidebar } from '@views/reference/ui/CategorySidebar';

interface MobileCategoryMenuProps {
  categories: Category[];
}

export function MobileCategoryMenu({ categories }: MobileCategoryMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="outline" size="icon" aria-label="카테고리 메뉴 열기" className="shadow-sm shrink-0 mt-1">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">카테고리 목록</SheetTitle>
        <div className="pt-8">
          <CategorySidebar categories={categories} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
