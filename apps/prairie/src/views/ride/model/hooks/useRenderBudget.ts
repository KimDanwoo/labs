import { useThree } from '@react-three/fiber';
import { boundedDpr } from '@shared/lib/renderBudget';
import { useEffect } from 'react';

export function useRenderBudget(desired: number, pixels: number): void {
  const { size, setDpr } = useThree();
  useEffect(() => {
    setDpr(boundedDpr(size.width, size.height, desired, pixels));
  }, [size.width, size.height, desired, pixels, setDpr]);
}
