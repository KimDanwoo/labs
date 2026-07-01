'use client';

import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  bathroomActiveAtom,
  bathroomExitAtAtom,
  pendingPoopsAtom,
  poopsAtom,
} from '../store';

const BATHROOM_EXIT_DELAY_MS = 5000;

export function useBathroomExit() {
  const poopsCount = useAtomValue(poopsAtom).length;
  const pendingPoopsCount = useAtomValue(pendingPoopsAtom).length;
  const [active, setActive] = useAtom(bathroomActiveAtom);
  const [exitAt, setExitAt] = useAtom(bathroomExitAtAtom);

  useEffect(() => {
    if (!active && poopsCount > 0) {
      setActive(true);
    }
  }, [active, poopsCount, setActive]);

  useEffect(() => {
    if (!active) return;

    const allClear = poopsCount === 0 && pendingPoopsCount === 0;

    if (allClear && exitAt === null) {
      setExitAt(Date.now());
      return;
    }

    if (!allClear && exitAt !== null) {
      setExitAt(null);
    }
  }, [active, exitAt, poopsCount, pendingPoopsCount, setExitAt]);

  useEffect(() => {
    if (exitAt === null) return;
    const timer = setTimeout(() => {
      setExitAt(null);
      setActive(false);
    }, BATHROOM_EXIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [exitAt, setExitAt, setActive]);
}
