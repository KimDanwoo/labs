import { cn } from '@shared/lib/cn';
import styles from '@views/slitherlink/ui/SlitherlinkBackdrop.module.css';

export function SlitherlinkBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0">
      <div className={cn(styles.lattice, 'absolute inset-0')} />
      <div className="absolute top-0 left-1/4 size-96 rounded-full bg-gradient-from/15 blur-3xl dark:bg-gradient-from/8" />
      <div className="absolute right-1/4 bottom-1/4 size-80 rounded-full bg-gradient-to/10 blur-3xl dark:bg-gradient-to/8" />
    </div>
  );
}
