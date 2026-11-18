import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';

interface PageStepButtonProps {
  href: string | null;
  label: string;
  Icon: LucideIcon;
}

export function PageStepButton({ href, label, Icon }: PageStepButtonProps) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        <Icon className="size-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild className="shadow-sm">
      <Link href={href} aria-label={label}>
        <Icon className="size-4" />
      </Link>
    </Button>
  );
}
