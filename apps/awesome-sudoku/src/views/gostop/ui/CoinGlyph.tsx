import { cn } from '@shared/lib/cn';
import styles from '@views/gostop/styles/money.module.css';

interface CoinGlyphProps {
  className?: string;
  isEmpty?: boolean;
}

export function CoinGlyph({ className, isEmpty = false }: CoinGlyphProps) {
  return <span aria-hidden="true" className={cn(isEmpty ? styles.emptyCoin : styles.coin, className)} />;
}
