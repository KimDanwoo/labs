import { useEffect, useState } from 'react';

import { MIN_SCRAMBLE_KEYWORDS, REDUCED_MOTION_QUERY, SCRAMBLE_TIMING } from '../../config/motion';
import { glyphsAt, planDuration, planScramble, toGlyphs, type ScrambleGlyph } from '../../lib/scramble';

export function useScrambleGlyphs(keywords: readonly string[]) {
  const [glyphs, setGlyphs] = useState<ScrambleGlyph[]>(() => toGlyphs(keywords[0] ?? ''));

  useEffect(() => {
    const isReducedMotion = matchMedia(REDUCED_MOTION_QUERY).matches;
    if (isReducedMotion || keywords.length < MIN_SCRAMBLE_KEYWORDS) return undefined;

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
        if (isDone || now - lastPaintAt >= SCRAMBLE_TIMING.glyphFrameMs) {
          setGlyphs(glyphsAt(plan, elapsed));
          lastPaintAt = now;
        }
        if (isDone) {
          timerId = window.setTimeout(transitionToNext, SCRAMBLE_TIMING.holdMs);
          return;
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
    }

    timerId = window.setTimeout(transitionToNext, SCRAMBLE_TIMING.firstHoldMs);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
    };
  }, [keywords]);

  return glyphs;
}
