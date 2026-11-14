import { Events } from '../events';

interface Point {
  x: number;
  y: number;
}

interface Pinch {
  ratio: number;
  ratioDelta: number;
  baseDistance: number;
  distance: number;
  distanceDelta: number;
}

const MIN_PINCH_TOUCHES = 2;

const averageOf = (touches: readonly Touch[]): Point => ({
  x: touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length,
  y: touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length,
});

const widestSpread = (touches: readonly Touch[]): number =>
  Math.max(
    0,
    ...touches.flatMap((first, index) =>
      touches
        .slice(index + 1)
        .map((second) => Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)),
    ),
  );

const preventDefault = (event: Event): void => event.preventDefault();

export class Pointer {
  static readonly MODE_MOUSE = 1;
  static readonly MODE_TOUCH = 2;

  readonly events = new Events<{ down: []; up: []; move: []; pinch: [] }>();
  readonly current: Point = { x: 0, y: 0 };
  readonly delta: Point = { x: 0, y: 0 };
  readonly pinch: Pinch = { ratio: 1, ratioDelta: 0, baseDistance: 0, distance: 0, distanceDelta: 0 };
  mode: number = Pointer.MODE_MOUSE;
  isDown = false;
  hasMoved = false;
  touches: Touch[] = [];
  readonly #upcoming: Point = { x: 0, y: 0 };
  #isUpcomingDown = false;
  #upcomingTouches: Touch[] = [];

  constructor(element: HTMLElement) {
    element.addEventListener('mousemove', this.#handleMouseMove);
    element.addEventListener('mousedown', this.#handleMouseDown);
    addEventListener('mouseup', this.#handleMouseUp);
    element.addEventListener('touchmove', this.#handleTouchMove, { passive: true });
    element.addEventListener('touchstart', this.#handleTouchStart, { passive: true });
    element.addEventListener('touchend', this.#handleTouchEnd);
    element.addEventListener('contextmenu', preventDefault);
  }

  update(): void {
    this.delta.x = this.#upcoming.x - this.current.x;
    this.delta.y = this.#upcoming.y - this.current.y;
    Object.assign(this.current, this.#upcoming);
    this.#updatePinch();
    this.touches = [...this.#upcomingTouches];
    this.hasMoved = this.delta.x !== 0 || this.delta.y !== 0;
    this.#updateDown();
    if (this.hasMoved) this.events.trigger('move');
  }

  #updatePinch(): void {
    if (this.#upcomingTouches.length < MIN_PINCH_TOUCHES) {
      Object.assign(this.pinch, { baseDistance: 0, distance: 0, distanceDelta: 0 });
      return;
    }
    const distance = widestSpread(this.#upcomingTouches);
    const isNewTouch = this.#upcomingTouches.length > this.touches.length;
    this.pinch.distanceDelta = isNewTouch ? 0 : distance - this.pinch.distance;
    this.pinch.distance = distance;
    if (isNewTouch) this.pinch.baseDistance = distance;

    const ratio = this.pinch.distance / this.pinch.baseDistance;
    if (ratio === this.pinch.ratio) return;
    this.pinch.ratioDelta = ratio - this.pinch.ratio;
    this.pinch.ratio = ratio;
    this.events.trigger('pinch');
  }

  #updateDown(): void {
    if (this.#isUpcomingDown === this.isDown) return;
    this.isDown = this.#isUpcomingDown;
    this.events.trigger(this.isDown ? 'down' : 'up');
  }

  #aimAt(point: Point): void {
    Object.assign(this.#upcoming, point);
  }

  #jumpTo(point: Point): void {
    Object.assign(this.#upcoming, point);
    Object.assign(this.current, point);
  }

  #handleMouseMove = (event: MouseEvent): void => {
    event.preventDefault();
    this.mode = Pointer.MODE_MOUSE;
    this.#aimAt({ x: event.clientX, y: event.clientY });
  };

  #handleMouseDown = (event: MouseEvent): void => {
    event.preventDefault();
    this.mode = Pointer.MODE_MOUSE;
    this.#isUpcomingDown = true;
    this.#jumpTo({ x: event.clientX, y: event.clientY });
  };

  #handleMouseUp = (event: MouseEvent): void => {
    event.preventDefault();
    this.#isUpcomingDown = false;
  };

  #handleTouchMove = (event: TouchEvent): void => {
    this.mode = Pointer.MODE_TOUCH;
    this.#upcomingTouches = [...event.touches];
    this.#aimAt(averageOf(this.#upcomingTouches));
  };

  #handleTouchStart = (event: TouchEvent): void => {
    this.mode = Pointer.MODE_TOUCH;
    this.#isUpcomingDown = true;
    this.#upcomingTouches = [...event.touches];
    this.#jumpTo(averageOf(this.#upcomingTouches));
  };

  #handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();
    this.#upcomingTouches = [...event.touches];
    if (this.#upcomingTouches.length <= 1) this.#isUpcomingDown = false;
  };
}
