import type { TimeOfDay } from '@features/walk/model/constants';
import type { IconName } from './Icon';

export const TIME_ICON = { day: 'sun', evening: 'sunset', night: 'moon' } satisfies Record<TimeOfDay, IconName>;
