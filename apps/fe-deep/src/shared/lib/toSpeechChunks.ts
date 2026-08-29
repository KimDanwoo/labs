/** 브라우저 TTS가 한 번에 안정적으로 읽는 길이. 크롬은 긴 발화를 도중에 끊는다. */
const CHUNK_LIMIT = 180;

/** 마크다운 → 낭독용 평문. 코드블록·이미지·링크 URL 등 소리로 들으면 소음인 것을 걷어낸다. */
function toSpeechText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]*\|?[ \t:|-]{3,}\|[ \t:|-]*$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*|~~|\*/g, '')
    .replace(/^[ \t]*\|[ \t]*|[ \t]*\|[ \t]*$/gm, '')
    .replace(/[ \t]*\|[ \t]*/g, ', ')
    .replace(/\s*\n\s*\n\s*/g, '. ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/([.!?。])\s*\./g, '$1')
    .trim();
}

/** 문장 단위로 잘라 CHUNK_LIMIT 안에서 다시 뭉친다. 짧은 발화로 나눠야 크롬이 중간에 끊지 않는다. */
export function toSpeechChunks(markdown: string): string[] {
  // ponytail: 마침표 없이 CHUNK_LIMIT을 넘는 한 문장은 그대로 둔다. 실제로 잘리면 쉼표 기준 분할 추가.
  const sentences = toSpeechText(markdown).match(/[^.!?。]+[.!?。]*\s*/g) ?? [];

  return sentences
    .reduce<string[]>((chunks, sentence) => {
      const last = chunks[chunks.length - 1];
      if (last && last.length + sentence.length <= CHUNK_LIMIT) {
        chunks[chunks.length - 1] = last + sentence;
        return chunks;
      }
      return [...chunks, sentence];
    }, [])
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}
