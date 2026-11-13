'use client';

import { cn } from '@shared/lib/cn';
import { matchKeywords } from '@shared/lib/matchKeywords';
import { Check, X } from 'lucide-react';

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
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
              isMatched ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {isMatched ? <Check className="size-3" /> : <X className="size-3 opacity-50" />}
            {keyword}
          </li>
        ))}
      </ul>
    </div>
  );
}
