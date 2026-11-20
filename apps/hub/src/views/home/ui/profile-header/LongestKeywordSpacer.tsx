interface LongestKeywordSpacerProps {
  keywords: readonly string[];
}

export function LongestKeywordSpacer({ keywords }: LongestKeywordSpacerProps) {
  return keywords.map((keyword) => (
    <span key={keyword} className="invisible col-start-1 row-start-1">
      {keyword}
    </span>
  ));
}
