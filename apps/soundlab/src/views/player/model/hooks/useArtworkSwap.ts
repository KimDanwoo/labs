import { useEffect, useRef } from 'react';

import { loadArtwork, warmNeighbors } from '../../lib/stage/artworkCache';

export function useArtworkSwap(index: number) {
  const pendingRef = useRef<number | null>(null);
  const wantRef = useRef(0);
  const readyRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    pendingRef.current = index;
    wantRef.current = 0;
    readyRef.current = null;
    loadArtwork(index)
      .then((image) => {
        if (pendingRef.current === index) readyRef.current = image;
        warmNeighbors(index);
      })
      .catch(() => undefined);
  }, [index]);

  const readWant = () => wantRef.current;

  const takeReadyArtwork = () => {
    const image = readyRef.current;
    if (pendingRef.current === null || !image) return null;
    pendingRef.current = null;
    readyRef.current = null;
    wantRef.current = 1;
    return image;
  };

  return { readWant, takeReadyArtwork };
}
