import type { FRIEND_ACTIVITY } from '@views/walk/config/walk';
import type { SchoolmateId } from '@views/walk/model/schoolmateRoster';

export type FriendActivity =
  | { kind: typeof FRIEND_ACTIVITY.none }
  | { kind: typeof FRIEND_ACTIVITY.greeting | typeof FRIEND_ACTIVITY.ball; id: SchoolmateId };
