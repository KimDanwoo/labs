import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { styles } from './StudyRunner.styles';

interface TopicNotesProps {
  topicTitle: string;
  notes: string;
}

export function TopicNotes({ topicTitle, notes }: TopicNotesProps) {
  return (
    <details className={styles.notes}>
      <summary className={styles.notesToggle}>참고 자료 — {topicTitle}</summary>
      <div className={styles.notesBody}>
        <MarkdownRenderer content={notes} />
      </div>
    </details>
  );
}
