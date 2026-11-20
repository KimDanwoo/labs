import { useEffect, useState } from 'react';
import { FADE_MS } from '../../lib/scene/sceneLoader';

export function useLoaderRemoval(ready: boolean): boolean {
  const [isRemoved, setIsRemoved] = useState(false);
  useEffect(() => {
    if (!ready) return undefined;
    const id = setTimeout(() => setIsRemoved(true), FADE_MS);
    return () => clearTimeout(id);
  }, [ready]);
  return isRemoved;
}
