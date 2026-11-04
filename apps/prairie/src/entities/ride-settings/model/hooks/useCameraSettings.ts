'use client';

import { cameraSettings } from '@entities/ride-settings/model/store';
import { useSyncExternalStore } from 'react';

export function useCameraSettings() {
  return useSyncExternalStore(cameraSettings.subscribe, cameraSettings.get, cameraSettings.getServer);
}
