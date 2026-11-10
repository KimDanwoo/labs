'use client';

import { createContext, useContext } from 'react';

export const SceneQualityContext = createContext(false);

export function useLowDetail() {
  return useContext(SceneQualityContext);
}
