'use client';

import { parseStoredText, readStoredText, subscribeStored, writeStored } from '@views/gostop/lib/storage';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

const getServerSnapshot = (): string | null => null;

export const useStoredValue = <T>(key: string, parse: (raw: unknown) => T): [T, (next: T) => void] => {
  const getSnapshot = useCallback(() => readStoredText(key), [key]);
  const text = useSyncExternalStore(subscribeStored, getSnapshot, getServerSnapshot);
  const value = useMemo(() => parse(parseStoredText(text)), [parse, text]);
  const save = useCallback((next: T) => writeStored(key, next), [key]);
  return [value, save];
};
