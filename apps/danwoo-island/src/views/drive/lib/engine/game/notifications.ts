import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { requireElement } from '@views/drive/lib/engine/game/utilities/requireElement';

interface NotificationOptions {
  type?: string;
  duration?: number;
}

interface Notice {
  content: HTMLElement;
  type: string;
  duration: number;
}

interface VisibleNotice {
  element: HTMLElement;
  timeBar: HTMLElement;
}

type NotificationState = 'visible' | 'hiding' | 'hidden';

const DEFAULT_DURATION = 3;

export class Notifications {
  readonly #items: HTMLElement;
  readonly #pending: Notice[] = [];
  #current: VisibleNotice | null = null;
  #state: NotificationState = 'hidden';
  #timeTotal = 0;
  #timeLeft = 0;
  #isHeld = false;

  constructor() {
    const game = getGame();
    const element = requireElement(game.domElement, '.js-notifications', HTMLElement);
    this.#items = requireElement(element, '.js-items', HTMLElement);
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.notifications);
  }

  show(content: HTMLElement, { type = '', duration = DEFAULT_DURATION }: NotificationOptions = {}): void {
    const notice = { content, type, duration };
    if (this.#current) this.#pending.push(notice);
    else this.#display(notice);
  }

  #display({ content, type, duration }: Notice): void {
    this.#state = 'visible';
    const element = document.createElement('div');
    element.classList.add('notification');
    if (type) element.classList.add(`is-${type}`);
    const timeBar = document.createElement('div');
    timeBar.classList.add('time-bar');
    element.append(content, timeBar);

    element.addEventListener('transitionend', (event) => {
      if (event.target === element && element.classList.contains('is-leaving')) this.#remove(element);
    });
    element.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        this.hide();
      },
      { once: true },
    );
    element.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') this.#isHeld = true;
    });
    element.addEventListener('pointerleave', () => {
      this.#isHeld = false;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => element.classList.add('is-visible')));

    this.#timeTotal = duration;
    this.#timeLeft = duration;
    this.#items.append(element);
    this.#current = { element, timeBar };
  }

  #remove(element: HTMLElement): void {
    this.#items.removeChild(element);
    this.#current = null;
    this.#state = 'hidden';
    const next = this.#pending.shift();
    if (next) this.#display(next);
  }

  hide(): void {
    if (this.#state !== 'visible' || !this.#current) return;
    this.#state = 'hiding';
    this.#current.element.classList.add('is-leaving');
  }

  update(): void {
    if (this.#state !== 'visible' || this.#isHeld || !this.#current) return;
    this.#timeLeft = Math.max(0, this.#timeLeft - getGame().ticker.delta);
    this.#current.timeBar.style.transform = `scaleX(${this.#timeLeft / this.#timeTotal})`;
    if (this.#timeLeft === 0) this.hide();
  }
}
