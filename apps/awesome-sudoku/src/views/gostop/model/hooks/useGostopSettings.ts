'use client';

import { STORAGE_KEY } from '@views/gostop/config/storage';
import { parseSettings } from '@views/gostop/lib/settings';
import { useStoredValue } from '@views/gostop/model/hooks/useStoredValue';
import type { Speed } from '@views/gostop/model/types/playback';
import type { GostopSettings } from '@views/gostop/model/types/record';
import { useMemo } from 'react';

export interface GostopSettingsControl extends GostopSettings {
  setSpeed: (speed: Speed) => void;
  toggleMute: () => void;
}

export const useGostopSettings = (): GostopSettingsControl => {
  const [settings, save] = useStoredValue(STORAGE_KEY.SETTINGS, parseSettings);

  return useMemo(
    () => ({
      ...settings,
      setSpeed: (speed: Speed) => save({ ...settings, speed }),
      toggleMute: () => save({ ...settings, isMuted: !settings.isMuted }),
    }),
    [settings, save],
  );
};
