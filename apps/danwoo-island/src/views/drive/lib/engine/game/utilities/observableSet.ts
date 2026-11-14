export type SetChange<T> =
  | { type: 'add'; value: T }
  | { type: 'delete'; value: T }
  | { type: 'clear'; previousValues: T[] };

export class ObservableSet<T> extends Set<T> {
  readonly #onChange: (change: SetChange<T>) => void;

  constructor(onChange: (change: SetChange<T>) => void, values?: Iterable<T>) {
    super(values);
    this.#onChange = onChange;
  }

  override add(value: T): this {
    const isNew = !this.has(value);
    super.add(value);
    if (isNew) this.#onChange({ type: 'add', value });
    return this;
  }

  override delete(value: T): boolean {
    const isDeleted = super.delete(value);
    if (isDeleted) this.#onChange({ type: 'delete', value });
    return isDeleted;
  }

  override clear(): void {
    if (this.size === 0) return;
    const previousValues = [...this];
    super.clear();
    this.#onChange({ type: 'clear', previousValues });
  }
}
