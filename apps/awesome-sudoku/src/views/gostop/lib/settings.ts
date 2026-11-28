import { SPEED } from '@views/gostop/config/playback';
import { isPlainObject } from '@views/gostop/lib/storage';
import type { Speed } from '@views/gostop/model/types/playback';
import type { GostopSettings } from '@views/gostop/model/types/record';

export const DEFAULT_SETTINGS: GostopSettings = { speed: SPEED.NORMAL, isMuted: false };

const SPEEDS: ReadonlySet<unknown> = new Set(Object.values(SPEED));

const isSpeed = (value: unknown): value is Speed => SPEEDS.has(value);

export function parseSettings(raw: unknown): GostopSettings {
  if (!isPlainObject(raw)) return DEFAULT_SETTINGS;
  const { speed, isMuted } = raw;
  return {
    speed: isSpeed(speed) ? speed : DEFAULT_SETTINGS.speed,
    isMuted: typeof isMuted === 'boolean' ? isMuted : DEFAULT_SETTINGS.isMuted,
  };
}
