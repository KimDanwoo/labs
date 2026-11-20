import type { IconName } from '@views/walk/config/icons';
import type { TimeOfDay } from '@views/walk/config/walk';

export const TIME_ICON = { day: 'sun', evening: 'sunset', night: 'moon' } satisfies Record<TimeOfDay, IconName>;
