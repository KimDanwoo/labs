'use client';

import { useScrambleGlyphs } from '../../model/hooks/useScrambleGlyphs';
import { styles } from './ScrambleKeyword.styles';

interface ScrambleKeywordProps {
  keywords: readonly string[];
}

export function ScrambleKeyword({ keywords }: ScrambleKeywordProps) {
  const glyphs = useScrambleGlyphs(keywords);

  return (
    <>
      <span className="sr-only">{keywords[0] ?? ''}</span>
      {/* 모든 키워드를 같은 칸에 겹쳐 두어 가장 긴 키워드 크기로 자리를 고정한다 — 전환 중 레이아웃이 밀리지 않는다 */}
      <span aria-hidden="true" className={styles.stack}>
        {keywords.map((keyword) => (
          <span key={keyword} className={styles.sizer}>
            {keyword}
          </span>
        ))}
        <span className={styles.glyphs}>
          {glyphs.map((glyph, index) => (
            <span key={index} className={glyph.isScrambling ? styles.scramblingGlyph : undefined}>
              {glyph.char}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}
