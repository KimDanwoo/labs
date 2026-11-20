import { useEffect } from 'react';

interface Disposable {
  dispose: () => void;
}

export type DisposeTarget = Disposable | readonly Disposable[] | Readonly<Record<string, Disposable>>;

function isDisposable(target: DisposeTarget): target is Disposable {
  return typeof (target as Disposable).dispose === 'function';
}

export function useDispose(target: DisposeTarget): void {
  useEffect(
    () => () => {
      if (isDisposable(target)) target.dispose();
      else Object.values(target).forEach((item) => item.dispose());
    },
    [target],
  );
}
