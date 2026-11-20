import { FADE_MS } from '@views/ride/lib/scene/sceneLoader';
import { useEffect, useState } from 'react';

export function useLoaderRemoval(ready: boolean): boolean {
  const [isRemoved, setIsRemoved] = useState(false);
  useEffect(() => {
    if (!ready) return undefined;
    const id = setTimeout(() => setIsRemoved(true), FADE_MS);
    return () => clearTimeout(id);
  }, [ready]);
  return isRemoved;
}
