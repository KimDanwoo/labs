import { useState } from 'react';

export const useHeldValue = <T>(value: T, isLive: boolean): T => {
  const [held, setHeld] = useState(value);
  const shouldHold = isLive && held !== value;

  if (shouldHold) setHeld(value);

  return isLive ? value : held;
};
