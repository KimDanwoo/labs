import { styles } from './StudyCardView.styles';

interface KeywordHintsProps {
  keywords: string[];
}

export function KeywordHints({ keywords }: KeywordHintsProps) {
  return (
    <details className={styles.hints}>
      <summary className={styles.hintsToggle}>키워드 힌트 보기 ({keywords.length})</summary>
      <ul className={styles.hintList}>
        {keywords.map((keyword) => (
          <li key={keyword} className={styles.hint}>
            {keyword}
          </li>
        ))}
      </ul>
    </details>
  );
}
