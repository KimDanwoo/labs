import * as THREE from 'three/webgpu';

type TextAlign = 'left' | 'center' | 'right';

interface TextCanvasOptions {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  width: number;
  height: number;
  density?: number;
  align?: TextAlign;
  lineHeight?: number;
}

const MAX_TEXT_WIDTH_RATIO = 0.94;

function anchorX(align: TextAlign, width: number): number {
  const anchors: Record<TextAlign, number> = { left: 0, center: width / 2, right: width };
  return anchors[align];
}

export class TextCanvas {
  readonly texture: THREE.Texture;
  readonly #context: CanvasRenderingContext2D;
  readonly #width: number;
  readonly #height: number;
  readonly #align: TextAlign;
  readonly #lineHeight: number;
  #lines: string[] = [];

  constructor({
    fontFamily = 'MaruBuri',
    fontWeight = '400',
    fontSize = 10,
    width,
    height,
    density = 1,
    align = 'center',
    lineHeight = 1,
  }: TextCanvasOptions) {
    this.#width = Math.ceil(width * density);
    this.#height = Math.ceil(height * density);
    this.#align = align;
    this.#lineHeight = lineHeight * density;

    const canvas = document.createElement('canvas');
    canvas.width = this.#width;
    canvas.height = this.#height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is not supported');
    context.font = `${fontWeight} ${fontSize * density}px "${fontFamily}"`;
    this.#context = context;

    this.texture = new THREE.Texture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.flipY = false;
    this.texture.generateMipmaps = false;
  }

  updateText(text: string | readonly string[]): void {
    this.#lines = typeof text === 'string' ? [text] : [...text];
    this.#draw();
  }

  getMeasure(): { width: number } {
    const widths = this.#lines.map((line) => this.#context.measureText(line).width);
    return { width: Math.max(0, ...widths) };
  }

  #draw(): void {
    const context = this.#context;
    context.fillStyle = '#000000';
    context.fillRect(0, 0, this.#width, this.#height);
    context.textAlign = this.#align;
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';

    const x = anchorX(this.#align, this.#width);
    const middleLine = (this.#lines.length - 1) / 2;
    for (const [index, line] of this.#lines.entries()) {
      const y = this.#height / 2 + (index - middleLine) * this.#lineHeight;
      context.fillText(line, x, y, this.#width * MAX_TEXT_WIDTH_RATIO);
    }
    this.texture.needsUpdate = true;
  }
}
