import type { JSX, RefObject } from 'react';
import { FRIEND_ACTIVITY, type TimeOfDay } from '../config/walk';
import type { createAmbience } from '../lib/audio';
import { COMPANION_PANEL, type CompanionPanelKind } from '../lib/companions';
import type { WalkEngine } from '../lib/scene';
import type { SCHOOLMATES, SchoolRegion } from '../model/schoolmateRoster';
import type { FriendActivity } from '../model/types/friendActivity';
import { BallGameHud } from './BallGameHud';
import { CompanionPanel } from './CompanionPanel';
import { FishingHud } from './FishingHud';
import { SchoolmateDialog } from './SchoolmateDialog';

type Friend = (typeof SCHOOLMATES)[number];

interface WalkActivitiesProps {
  engine: RefObject<WalkEngine | null>;
  companionPanel: CompanionPanelKind;
  isFishing: boolean;
  friendActivity: FriendActivity;
  activeFriend: Friend | null | undefined;
  friendRegion: SchoolRegion | null;
  timeOfDay: TimeOfDay;
  canPlayBall: boolean;
  onFishingSound: ReturnType<typeof createAmbience>['fishingCue'];
  onCloseCompanion: () => void;
  onCloseFishing: () => void;
  onPlayBall: (friend: Friend) => void;
  onCloseFriend: () => void;
}

export function WalkActivities({
  engine,
  companionPanel,
  isFishing,
  friendActivity,
  activeFriend,
  friendRegion,
  timeOfDay,
  canPlayBall,
  onFishingSound,
  onCloseCompanion,
  onCloseFishing,
  onPlayBall,
  onCloseFriend,
}: WalkActivitiesProps): JSX.Element {
  return (
    <>
      {companionPanel !== COMPANION_PANEL.none && (
        <CompanionPanel
          key={companionPanel}
          kind={companionPanel}
          onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
          onClose={onCloseCompanion}
        />
      )}
      {isFishing && (
        <FishingHud
          onSound={onFishingSound}
          onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
          onFrame={(frame) => engine.current?.setFishing(frame)}
          onClose={onCloseFishing}
        />
      )}
      {activeFriend && friendRegion && friendActivity.kind === FRIEND_ACTIVITY.greeting && (
        <SchoolmateDialog
          name={activeFriend.name}
          region={friendRegion}
          time={timeOfDay}
          canPlay={canPlayBall}
          onPlay={() => onPlayBall(activeFriend)}
          onClose={onCloseFriend}
        />
      )}
      {activeFriend && friendActivity.kind === FRIEND_ACTIVITY.ball && (
        <BallGameHud
          name={activeFriend.name}
          onFrame={(frame) => engine.current?.setBallGame(frame) ?? false}
          onClose={onCloseFriend}
        />
      )}
    </>
  );
}
