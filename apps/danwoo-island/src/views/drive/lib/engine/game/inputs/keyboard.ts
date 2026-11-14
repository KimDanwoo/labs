import { Events } from '../events';

const EDITABLE = 'input, textarea, [contenteditable]';

const isTypingIntoField = (event: KeyboardEvent): boolean =>
  document.activeElement?.matches(EDITABLE) === true && event.code !== 'Escape';

export class Keyboard {
  readonly events = new Events<{ down: [code: string, key: string]; up: [code: string, key?: string] }>();
  #pressed: string[] = [];

  constructor() {
    window.addEventListener('blur', this.#handleBlur);
    addEventListener('keydown', this.#handleKeyDown);
    addEventListener('keyup', this.#handleKeyUp);
  }

  #handleBlur = (): void => {
    for (const key of this.#pressed) this.events.trigger('up', key);
    this.#pressed = [];
  };

  #handleKeyDown = (event: KeyboardEvent): void => {
    if (isTypingIntoField(event)) return;
    this.#pressed.push(event.code, event.key);
    this.events.trigger('down', event.code, event.key);
  };

  #handleKeyUp = (event: KeyboardEvent): void => {
    this.#release(event.code);
    this.#release(event.key);
    this.events.trigger('up', event.code, event.key);
  };

  #release(value: string): void {
    const index = this.#pressed.indexOf(value);
    if (index !== -1) this.#pressed.splice(index, 1);
  }
}
