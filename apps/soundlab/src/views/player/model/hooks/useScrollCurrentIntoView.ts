import { useEffect, useRef } from 'react';

const CURRENT_ITEM_SELECTOR = '[aria-current="true"]';

export function useScrollCurrentIntoView(index: number) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.querySelector(CURRENT_ITEM_SELECTOR)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  return listRef;
}
