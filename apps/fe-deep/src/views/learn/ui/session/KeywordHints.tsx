interface KeywordHintsProps {
  keywords: string[];
}

export function KeywordHints({ keywords }: KeywordHintsProps) {
  return (
    <details className="mb-5">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
        키워드 힌트 보기 ({keywords.length})
      </summary>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {keywords.map((keyword) => (
          <li key={keyword} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {keyword}
          </li>
        ))}
      </ul>
    </details>
  );
}
