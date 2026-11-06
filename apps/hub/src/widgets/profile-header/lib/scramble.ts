/** 스크램블 중 잠깐 비치는 글자 — 기호와 한글 자모를 섞어 '디코딩되는' 느낌을 낸다. */
const GLYPHS = '!<>-_/\\[]{}=+*^?#%&$ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
const CHAR_STAGGER_MS = 30;
const MAX_START_JITTER_MS = 60;
const MIN_SCRAMBLE_MS = 450;
const MAX_SCRAMBLE_EXTRA_MS = 350;

export type ScrambleGlyph = { char: string; isScrambling: boolean };

type CharPlan = { from: string; to: string; startMs: number; endMs: number };

/** 글자마다 언제 흐트러지기 시작해 언제 새 글자로 정착할지 정한다. 왼쪽부터 조금씩 늦게 풀린다. */
export function planScramble(from: string, to: string): CharPlan[] {
  const fromChars = Array.from(from);
  const toChars = Array.from(to);
  const length = Math.max(fromChars.length, toChars.length);
  return Array.from({ length }, (_, index) => {
    const startMs = index * CHAR_STAGGER_MS + Math.random() * MAX_START_JITTER_MS;
    return {
      from: fromChars[index] ?? '',
      to: toChars[index] ?? '',
      startMs,
      endMs: startMs + MIN_SCRAMBLE_MS + Math.random() * MAX_SCRAMBLE_EXTRA_MS,
    };
  });
}

export function planDuration(plan: readonly CharPlan[]): number {
  return Math.max(0, ...plan.map((char) => char.endMs));
}

function randomGlyph(): string {
  return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
}

export function glyphsAt(plan: readonly CharPlan[], elapsedMs: number): ScrambleGlyph[] {
  return plan.map(({ from, to, startMs, endMs }) => {
    if (elapsedMs >= endMs) return { char: to, isScrambling: false };
    if (elapsedMs < startMs) return { char: from, isScrambling: false };
    return { char: randomGlyph(), isScrambling: true };
  });
}

export function toGlyphs(text: string): ScrambleGlyph[] {
  return Array.from(text, (char) => ({ char, isScrambling: false }));
}
