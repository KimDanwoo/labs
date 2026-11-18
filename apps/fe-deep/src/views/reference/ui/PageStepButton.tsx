import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';

import { styles } from './CategoryQuestionList.styles';

interface PageStepButtonProps {
  href: string | null;
  label: string;
  Icon: LucideIcon;
}

export function PageStepButton({ href, label, Icon }: PageStepButtonProps) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        <Icon className={styles.pageStepIcon} />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild className={styles.pageStep}>
      <Link href={href} aria-label={label}>
        <Icon className={styles.pageStepIcon} />
      </Link>
    </Button>
  );
}
