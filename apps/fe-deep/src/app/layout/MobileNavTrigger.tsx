import { Button } from '@shared/ui/Button';
import { SheetTrigger } from '@shared/ui/Sheet';
import { Menu } from 'lucide-react';

export function MobileNavTrigger() {
  return (
    <SheetTrigger asChild className="md:hidden">
      <Button variant="ghost" size="icon" aria-label="메뉴 열기">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
    </SheetTrigger>
  );
}
