import type { StudyDoc } from '../../lib/parseHandbook';
import { StudyDocRow } from './StudyDocRow';
import { styles } from './StudyDocTable.styles';

interface StudyDocTableProps {
  docs: StudyDoc[];
}

export function StudyDocTable({ docs }: StudyDocTableProps) {
  return (
    <div className={styles.frame}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headRow}>
            <th className={styles.docHead}>문서</th>
            <th className={styles.countHead}>주제</th>
            <th className={styles.countHead}>카드</th>
            <th className={styles.dateHead}>날짜</th>
            <th className={styles.arrowHead} aria-hidden />
          </tr>
        </thead>
        <tbody className={styles.body}>
          {docs.map((doc) => (
            <StudyDocRow key={doc.slug} doc={doc} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
