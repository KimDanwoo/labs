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
    <div className="rounded-lg border border-border/60 p-4">
      <p className="mb-2 text-xs font-normal text-muted-foreground">
        키워드 {matchedCount}/{matches.length} 언급
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {matches.map(({ keyword, isMatched }) => (
          <li
            key={keyword}
            className={cn(styles.keyword.base, isMatched ? styles.keyword.matched : styles.keyword.missed)}
          >
            {isMatched ? <Check className="size-3" /> : <X className="size-3 opacity-50" />}
            {keyword}
          </li>
        ))}
      </ul>
    </div>
  );
}
