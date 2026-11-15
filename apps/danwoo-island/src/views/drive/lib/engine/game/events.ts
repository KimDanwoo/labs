type EventArguments = readonly unknown[];
type Listener<A extends EventArguments> = (...args: A) => void;
type ListenersByOrder<A extends EventArguments> = Map<number, Listener<A>[]>;

const DEFAULT_ORDER = 1;

const byOrder = <A extends EventArguments>(listeners: ListenersByOrder<A>): ListenersByOrder<A> =>
  new Map([...listeners].sort(([a], [b]) => a - b));

export class Events<TEvents extends Record<string, EventArguments> = Record<string, unknown[]>> {
  #listeners: { [K in keyof TEvents]?: ListenersByOrder<TEvents[K]> } = {};

  on<K extends keyof TEvents>(name: K, listener: Listener<TEvents[K]>, order = DEFAULT_ORDER): this {
    const listeners = this.#listeners[name] ?? new Map();
    const sameOrder = listeners.get(order);
    if (sameOrder) {
      sameOrder.push(listener);
      return this;
    }
    listeners.set(order, [listener]);
    this.#listeners[name] = byOrder(listeners);
    return this;
  }

  off<K extends keyof TEvents>(name: K, listener?: Listener<TEvents[K]>): this {
    if (!listener) {
      delete this.#listeners[name];
      return this;
    }
    for (const sameOrder of this.#listeners[name]?.values() ?? []) {
      const index = sameOrder.indexOf(listener);
      if (index !== -1) sameOrder.splice(index, 1);
    }
    return this;
  }

  trigger<K extends keyof TEvents>(name: K, ...args: TEvents[K]): this {
    for (const sameOrder of this.#listeners[name]?.values() ?? []) {
      for (const listener of sameOrder) Reflect.apply(listener, this, args);
    }
    return this;
  }
}
