'use client';

import { Check, X } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { matchKeywords } from '@shared/lib/matchKeywords';

import { styles } from './KeywordCheck.styles';

interface KeywordCheckProps {
  keywords: string[];
  recall: string;
}

export function KeywordCheck({ keywords, recall }: KeywordCheckProps) {
  const matches = matchKeywords(keywords, recall);
  const matchedCount = matches.filter((match) => match.isMatched).length;

  return (
    <div className={styles.root}>
      <p className={styles.summary}>
        키워드 {matchedCount}/{matches.length} 언급
      </p>
      <ul className={styles.list}>
        {matches.map(({ keyword, isMatched }) => (
          <li
            key={keyword}
            className={cn(styles.keyword.base, isMatched ? styles.keyword.matched : styles.keyword.missed)}
          >
            {isMatched ? <Check className={styles.matchedIcon} /> : <X className={styles.missedIcon} />}
            {keyword}
          </li>
        ))}
      </ul>
    </div>
  );
}
