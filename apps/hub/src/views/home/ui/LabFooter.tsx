import { COPYRIGHT, SITE_NAME } from '../config/page';
import { styles } from './LabFooter.styles';

export function LabFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>{SITE_NAME}</span>
        <span>{COPYRIGHT}</span>
      </div>
    </footer>
  );
}
