import { cn } from '@shared/lib/cn';
import styles from '@views/slitherlink/ui/SlitherlinkBackdrop.module.css';

export function SlitherlinkBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0">
      <div className={cn(styles.lattice, 'absolute inset-0')} />
    </div>
  );
}
