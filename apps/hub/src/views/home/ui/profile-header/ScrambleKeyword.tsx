'use client';

import { useScrambleGlyphs } from '@views/home/model/hooks/useScrambleGlyphs';
import { LongestKeywordSpacer } from '@views/home/ui/profile-header/LongestKeywordSpacer';

interface ScrambleKeywordProps {
  keywords: readonly string[];
}

export function ScrambleKeyword({ keywords }: ScrambleKeywordProps) {
  const glyphs = useScrambleGlyphs(keywords);

  return (
    <>
      <span className="sr-only">{keywords[0] ?? ''}</span>
      <span aria-hidden="true" className="inline-grid overflow-x-clip whitespace-pre select-none">
        <LongestKeywordSpacer keywords={keywords} />
        <span className="col-start-1 row-start-1">
          {glyphs.map((glyph, index) => (
            <span key={index} className={glyph.isScrambling ? 'text-primary' : undefined}>
              {glyph.char}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}
