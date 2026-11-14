import { Events } from '../events';
import { requireElement } from '../utilities/requireElement';

interface ButtonItem {
  name: string;
  isVisible: boolean;
  element: HTMLElement;
}

const VISIBLE = 'is-visible';
const ACTIVE = 'is-active';

export class InteractiveButtons {
  readonly events = new Events();
  isActive = false;
  readonly #element = requireElement(document, '.js-touch-buttons', HTMLElement);
  readonly #overlay = requireElement(this.#element, '.js-overlay', HTMLElement);
  readonly #shown = new Set<string>();
  readonly #items = new Map<string, ButtonItem>();

  constructor() {
    for (const element of this.#element.querySelectorAll<HTMLElement>('.js-button')) this.#register(element);
  }

  addItems(names: readonly string[] = []): void {
    for (const name of names) this.#shown.add(name);
    this.#render();
  }

  removeItems(names: readonly string[] = []): void {
    for (const name of names) this.#shown.delete(name);
    this.#render();
  }

  clearItems(): void {
    this.#shown.clear();
    this.#render();
  }

  activate(): void {
    this.#setActive(true);
  }

  deactivate(): void {
    this.#setActive(false);
  }

  #register(element: HTMLElement): void {
    const name = element.dataset.name ?? '';
    this.#items.set(name, { name, isVisible: false, element });
    element.addEventListener('click', () => {
      this.events.trigger('click', name);
      this.events.trigger(name);
    });
  }

  #render(): void {
    for (const item of this.#items.values()) {
      const shouldShow = this.#shown.has(item.name);
      if (item.isVisible === shouldShow) continue;
      item.isVisible = shouldShow;
      item.element.classList.toggle(VISIBLE, shouldShow);
    }
    this.#overlay.classList.toggle(
      VISIBLE,
      [...this.#items.values()].some((item) => item.isVisible),
    );
  }

  #setActive(isActive: boolean): void {
    if (this.isActive === isActive) return;
    this.isActive = isActive;
    this.#element.classList.toggle(ACTIVE, isActive);
  }
}
