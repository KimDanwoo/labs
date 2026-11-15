import { getGame } from './gameContext';
import { QUALITY } from './quality';
import { createElement } from './utilities/createElement';
import { requireElement } from './utilities/requireElement';

const PAINTS = ['black', 'orange', 'white', 'red', 'flames', 'abyssal'] as const;
type PaintName = (typeof PAINTS)[number];
const DEFAULT_PAINT: PaintName = 'black';
const PAINT_STORAGE_KEY = 'danwoo-island-paint';
const QUALITY_LABEL = { [QUALITY.high]: '높음', [QUALITY.low]: '낮음' } as const;

function isPaintName(value: unknown): value is PaintName {
  return PAINTS.some((paint) => paint === value);
}

function storedPaint(): PaintName {
  const stored = localStorage.getItem(PAINT_STORAGE_KEY);
  return isPaintName(stored) ? stored : DEFAULT_PAINT;
}

export class Options {
  paintName: PaintName = storedPaint();
  readonly #element: HTMLElement;

  constructor() {
    const { menu } = getGame();
    const content: unknown = menu.items?.get('options')?.contentElement;
    if (!(content instanceof HTMLElement)) throw new Error('Options menu content is missing');
    this.#element = content;
    this.#bindSound();
    this.#bindQuality();
    this.#bindButton('.js-respawn', () => getGame().player.respawn());
    this.#bindButton('.js-reset', () => getGame().reset());
    this.#showRenderer();
    this.#bindPaint();
  }

  #find(selector: string): HTMLElement {
    return requireElement(this.#element, selector, HTMLElement);
  }

  #bindSound(): void {
    this.#find('.js-audio-toggle').addEventListener('click', () => getGame().audio.mute.toggle());
  }

  #bindQuality(): void {
    const { quality } = getGame();
    const element = this.#find('.js-quality-toggle');
    const label = requireElement(element, 'span', HTMLElement);
    const renderLabel = (): void => {
      label.textContent = QUALITY_LABEL[quality.level];
    };
    renderLabel();
    element.addEventListener('click', () => {
      quality.changeLevel(quality.level === QUALITY.high ? QUALITY.low : QUALITY.high);
    });
    quality.events.on('change', renderLabel);
  }

  #bindButton(selector: string, action: () => void): void {
    this.#find(selector).addEventListener('click', () => {
      action();
      getGame().menu.close();
    });
  }

  #showRenderer(): void {
    if (getGame().rendering.isWebGPU()) return;
    const element = this.#find('.js-renderer');
    element.classList.remove('is-success');
    element.classList.add('is-danger');
    requireElement(element, 'span', HTMLElement).textContent = 'WebGL';
    requireElement(element, '.js-tooltip', HTMLElement).replaceChildren(
      '이 브라우저는 WebGPU를 ',
      createElement('strong', '', ['지원하지 않아']),
      ' 성능이 낮아질 수 있어요',
    );
  }

  #bindPaint(): void {
    const select = requireElement(this.#element, '.js-paint-select', HTMLSelectElement);
    select.value = this.paintName;
    select.addEventListener('change', () => {
      if (!isPaintName(select.value)) return;
      this.paintName = select.value;
      localStorage.setItem(PAINT_STORAGE_KEY, this.paintName);
      getGame().world.visualVehicle?.changePaint(this.paintName);
    });
  }
}
