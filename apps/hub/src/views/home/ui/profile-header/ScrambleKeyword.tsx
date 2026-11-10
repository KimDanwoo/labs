'use client';

import { useEffect, useState } from 'react';

import { glyphsAt, planDuration, planScramble, toGlyphs, type ScrambleGlyph } from '../../lib/scramble';

/** 헤드라인 단어 등장이 끝난 뒤 첫 전환을 시작한다. */
const FIRST_HOLD_MS = 1900;
const HOLD_MS = 1700;
/** 흐트러진 글자가 너무 빨리 깜빡이지 않게 화면 갱신 간격을 둔다. */
const GLYPH_FRAME_MS = 35;

type ScrambleKeywordProps = { keywords: readonly string[] };

/** 키워드가 기호·자모로 흐트러졌다가 다음 키워드로 풀리며 계속 바뀐다. 낭독기에는 첫 키워드만 읽힌다. */
export function ScrambleKeyword({ keywords }: ScrambleKeywordProps) {
  const firstKeyword = keywords[0] ?? '';
  const [glyphs, setGlyphs] = useState<ScrambleGlyph[]>(() => toGlyphs(firstKeyword));

  useEffect(() => {
    const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion || keywords.length < 2) return undefined;

    let keywordIndex = 0;
    let frameId = 0;
    let timerId = 0;

    function transitionToNext() {
      const from = keywords[keywordIndex] ?? '';
      keywordIndex = (keywordIndex + 1) % keywords.length;
      const plan = planScramble(from, keywords[keywordIndex] ?? '');
      const duration = planDuration(plan);
      const startedAt = performance.now();
      let lastPaintAt = 0;

      function frame(now: number) {
        const elapsed = now - startedAt;
        const isDone = elapsed >= duration;
        if (isDone || now - lastPaintAt >= GLYPH_FRAME_MS) {
          setGlyphs(glyphsAt(plan, elapsed));
          lastPaintAt = now;
        }
        if (isDone) {
          timerId = window.setTimeout(transitionToNext, HOLD_MS);
          return;
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
    }

    timerId = window.setTimeout(transitionToNext, FIRST_HOLD_MS);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
    };
  }, [keywords]);

  return (
    <>
      <span className="sr-only">{firstKeyword}</span>
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
