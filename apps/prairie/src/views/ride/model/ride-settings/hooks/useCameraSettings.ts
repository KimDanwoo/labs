'use client';

import { cameraSettings } from '@views/ride/model/ride-settings/store/cameraSettings';
import { useSyncExternalStore } from 'react';

export function useCameraSettings() {
  return useSyncExternalStore(cameraSettings.subscribe, cameraSettings.get, cameraSettings.getServer);
}
