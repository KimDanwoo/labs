export interface AutoBinding {
  update: () => void;
}

export function autoBinding<T extends object, K extends keyof T>(
  object: T,
  property: K,
  compute: () => T[K],
): AutoBinding {
  return {
    update: () => {
      object[property] = compute();
    },
  };
}
