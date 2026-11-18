import type { TimeOfDay } from '../config/walk';
import type { IconName } from './Icon';

export const TIME_ICON = { day: 'sun', evening: 'sunset', night: 'moon' } satisfies Record<TimeOfDay, IconName>;
