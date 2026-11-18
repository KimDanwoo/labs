'use client';

import { useScrambleGlyphs } from '../../model/hooks/useScrambleGlyphs';

interface ScrambleKeywordProps {
  keywords: readonly string[];
}

export function ScrambleKeyword({ keywords }: ScrambleKeywordProps) {
  const glyphs = useScrambleGlyphs(keywords);

  return (
    <>
      <span className="sr-only">{keywords[0] ?? ''}</span>
      {/* 모든 키워드를 같은 칸에 겹쳐 두어 가장 긴 키워드 크기로 자리를 고정한다 — 전환 중 레이아웃이 밀리지 않는다 */}
      <span aria-hidden="true" className="inline-grid overflow-x-clip whitespace-pre select-none">
        {keywords.map((keyword) => (
          <span key={keyword} className="invisible col-start-1 row-start-1">
            {keyword}
          </span>
        ))}
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
