import type { IconName } from '../config/icons';
import type { TimeOfDay } from '../config/walk';

export const TIME_ICON = { day: 'sun', evening: 'sunset', night: 'moon' } satisfies Record<TimeOfDay, IconName>;
