import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

interface Glyph {
  character: string;
  size: number;
  position: number;
}

const FRAME_INTERVAL = 1 / 60;
const LINE_LENGTH = 30;
const CAR_POSITION = 10;
const TREE_INTERVAL = 18;
const GLYPH_SIZE = 4;
const TITLE_PREFIX = 'Danwoo Island ';
const NON_BREAKING_SPACE = '\u00a0';

function glyphsAt(offset: number): Glyph[] {
  const glyphs: Glyph[] = [];
  for (let position = 0; position < LINE_LENGTH; position += 1) {
    if (position === CAR_POSITION) glyphs.push({ character: '🚗', size: GLYPH_SIZE, position });
    if ((position - offset) % TREE_INTERVAL === 0) glyphs.push({ character: '🌳', size: GLYPH_SIZE, position });
  }
  return glyphs;
}

function separateOverlaps(glyphs: Glyph[]): void {
  for (const [index, left] of glyphs.entries()) {
    const right = glyphs[index + 1];
    if (!right || left.position + left.size <= right.position) continue;
    const overlap = left.position + left.size - right.position;
    const leftShift = left.position - Math.ceil(overlap / 2) < 0 ? 0 : Math.ceil(overlap / 2);
    left.position -= leftShift;
    right.position += overlap - leftShift;
  }
}

function render(glyphs: Glyph[]): string {
  const cells: string[] = Array.from({ length: LINE_LENGTH }, () => NON_BREAKING_SPACE);
  for (const [index, glyph] of glyphs.entries()) {
    cells.splice(glyph.position, glyph.size, glyph.character);
    for (const next of glyphs.slice(index + 1)) next.position -= glyph.size - 1;
  }
  return cells.join('');
}

export class Title {
  #lastTime = 0;
  #offset = 0;
  #roundedOffset = 0;

  constructor() {
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER.title);
  }

  update(): void {
    const { physicalVehicle, ticker } = getGame();
    this.#offset += physicalVehicle.forwardSpeed * ticker.deltaScaled;
    const roundedOffset = Math.floor(this.#offset);
    const isDue = ticker.elapsed - this.#lastTime > FRAME_INTERVAL;
    if (!isDue || roundedOffset === this.#roundedOffset) return;

    this.#lastTime = ticker.elapsed;
    this.#roundedOffset = roundedOffset;
    const glyphs = glyphsAt(roundedOffset);
    separateOverlaps(glyphs);
    document.title = TITLE_PREFIX + render(glyphs);
  }
}
