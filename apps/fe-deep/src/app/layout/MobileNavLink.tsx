import { Button } from '@shared/ui/Button';
import Link from 'next/link';

import type { NavItem } from '../config/navigation';

interface MobileNavLinkProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}

export function MobileNavLink({ item: { href, label, icon: Icon }, isActive, onNavigate }: MobileNavLinkProps) {
  return (
    <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start gap-3" asChild>
      <Link href={href} onClick={onNavigate}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
