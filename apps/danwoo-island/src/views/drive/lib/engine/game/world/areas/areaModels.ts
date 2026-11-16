export interface NamedModel {
  readonly name: string;
}

export function forEachAreaModel<N extends string, M extends NamedModel>(
  children: readonly M[],
  names: readonly N[],
  build: (name: N, model: M) => void,
): void {
  for (const child of children) {
    for (const name of names) {
      if (child.name.startsWith(name)) build(name, child);
    }
  }
}
