import normalizeWheel from 'normalize-wheel';

import { Events } from '@views/drive/lib/engine/game/events';

export class Wheel {
  readonly events = new Events<{ roll: [spin: number] }>();

  constructor() {
    addEventListener('wheel', this.#handleWheel, { passive: true });
  }

  #handleWheel = (event: WheelEvent): void => {
    const { spinX, spinY } = normalizeWheel(event);
    this.events.trigger('roll', event.shiftKey ? spinX : spinY);
  };
}
