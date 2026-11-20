import { Events } from '@views/drive/lib/engine/game/events';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { isShown, type PanelState } from '@views/drive/lib/engine/game/panelState';
import { requireElement } from '@views/drive/lib/engine/game/utilities/requireElement';

type PanelEvents = { open: []; close: []; opened: []; closed: [] };

export interface ModalItem {
  readonly name: string;
  readonly element: HTMLElement;
  readonly mainFocus: HTMLElement | null;
  readonly events: Events<PanelEvents>;
  isOpen: boolean;
}

function onNextFrame(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

export class Modals {
  readonly events = new Events<PanelEvents>();
  readonly items = new Map<string, ModalItem>();
  state: PanelState = 'closed';
  readonly #element = requireElement(document, '.js-modals', HTMLElement);
  #current: ModalItem | null = null;
  #pending: string | null = null;

  constructor() {
    this.#bindClose();
    for (const element of this.#element.querySelectorAll<HTMLElement>('.js-modal')) {
      const name = element.dataset.name ?? '';
      this.items.set(name, {
        name,
        element,
        mainFocus: element.querySelector<HTMLElement>('.js-main-focus'),
        events: new Events<PanelEvents>(),
        isOpen: false,
      });
    }
    this.#preopen();
    this.#element.addEventListener('transitionend', () => this.#onTransitionEnd());
  }

  #onTransitionEnd(): void {
    const current = this.#current;
    if (!current) return;
    if (this.state === 'opening') {
      this.state = 'open';
      this.events.trigger('opened');
      current.events.trigger('opened');
      return;
    }
    if (this.state !== 'closing') return;

    this.state = 'closed';
    this.events.trigger('closed');
    current.events.trigger('closed');
    current.element.classList.remove('is-displayed');
    this.#current = null;
    const pending = this.#pending;
    this.#pending = null;
    if (pending) this.open(pending);
    else this.#element.classList.remove('is-displayed');
  }

  #bindClose(): void {
    for (const element of this.#element.querySelectorAll('.js-close')) {
      element.addEventListener('click', () => {
        this.#pending = null;
        this.close();
      });
    }
    this.#element.addEventListener('click', (event) => {
      if (event.target === this.#element) this.close();
    });
  }

  open(name: string): void {
    const item = this.items.get(name);
    if (!item) return;
    if (isShown(this.state)) {
      if (item === this.#current) return;
      this.#pending = name;
      this.close();
      return;
    }
    if (this.state === 'closing') {
      this.#pending = name;
      return;
    }
    this.#show(item);
  }

  #show(item: ModalItem): void {
    const game = getGame();
    game.audio.groups.get('click')?.play(true);
    this.#element.classList.add('is-displayed');
    item.element.classList.add('is-displayed');
    onNextFrame(() => {
      this.#element.classList.add('is-visible');
      item.mainFocus?.focus();
    });

    this.state = 'opening';
    this.#current = item;
    game.inputs.filters.clear();
    game.inputs.filters.add('modal');
    item.isOpen = true;
    this.events.trigger('open');
    item.events.trigger('open');
  }

  close(): void {
    if (!isShown(this.state) || !this.#current) return;
    getGame().audio.groups.get('click')?.play(false);
    this.#element.classList.remove('is-visible');
    this.state = 'closing';
    this.#current.isOpen = false;
    this.events.trigger('close');
    this.#current.events.trigger('close');
  }

  #preopen(): void {
    for (const item of this.items.values()) {
      if (item.element.dataset.preopen !== undefined) this.open(item.name);
    }
  }
}
