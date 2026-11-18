import { ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

import { formatStudyDate } from '../../lib/formatStudyDate';
import { countSteps, type StudyDoc } from '../../lib/parseHandbook';
import { studyDocHref } from '../../lib/studyHref';
import { styles } from './StudyDocTable.styles';

interface StudyDocRowProps {
  doc: StudyDoc;
}

export function StudyDocRow({ doc }: StudyDocRowProps) {
  const stepCount = countSteps(doc);

  return (
    <tr className={styles.row}>
      <td className={styles.docCell}>
        <div className={styles.docSummary}>
          <span className={styles.docIcon}>
            <FileText className={styles.docGlyph} />
          </span>
          <div className={styles.docText}>
            <Link href={studyDocHref(doc.slug)} className={styles.docLink}>
              {doc.title}
            </Link>
            <p className={styles.docMeta}>
              주제 {doc.topics.length} · 카드 {stepCount}
            </p>
          </div>
        </div>
      </td>
      <td className={styles.countCell}>{doc.topics.length}</td>
      <td className={styles.countCell}>{stepCount}</td>
      <td className={styles.dateCell}>{formatStudyDate(doc.date)}</td>
      <td className={styles.arrowCell}>
        <ChevronRight className={styles.arrow} />
      </td>
    </tr>
  );
}
