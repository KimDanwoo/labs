'use client';

import { useSyncExternalStore } from 'react';
import { cameraSettings } from '../store/cameraSettings';

export function useCameraSettings() {
  return useSyncExternalStore(cameraSettings.subscribe, cameraSettings.get, cameraSettings.getServer);
}
