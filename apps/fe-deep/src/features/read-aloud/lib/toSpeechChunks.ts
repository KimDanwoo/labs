const CHROME_SAFE_UTTERANCE_LENGTH = 180;

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

export function toSpeechChunks(markdown: string): string[] {
  const sentences = toSpeechText(markdown).match(/[^.!?。]+[.!?。]*\s*/g) ?? [];

  return sentences
    .reduce<string[]>((chunks, sentence) => {
      const last = chunks[chunks.length - 1];
      const canJoinLast = last !== undefined && last.length + sentence.length <= CHROME_SAFE_UTTERANCE_LENGTH;
      if (canJoinLast) {
        chunks[chunks.length - 1] = last + sentence;
        return chunks;
      }
      return [...chunks, sentence];
    }, [])
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}
