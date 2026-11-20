import type { RefObject } from 'react';
import { DIALOG, FIRST_LOOK_LABEL, FRIEND_ACTIVITY, TIME_ORDER, type Dialog, type TimeOfDay } from '../../config/walk';
import { COMPANION_PANEL, type CompanionPanelKind } from '../../lib/companions';
import { diaryMemory, liveMemory } from '../../lib/memory';
import type { SceneStatus, WalkEngine } from '../../lib/scene';
import { SCHOOLMATES } from '../schoolmateRoster';
import { pageStores } from '../store/discoveries';
import type { FriendActivity } from '../types/friendActivity';
import type { Memory } from '../types/memory';
import { isNearSpot } from '../world/interactions';
import { LANDMARKS, type Landmark } from '../world/landmarks';
import type { PlaceAction } from '../world/world';

interface WalkInteractionOptions {
  engineRef: RefObject<WalkEngine | null>;
  status: SceneStatus;
  isPaused: boolean;
  timeOfDay: TimeOfDay;
  pages: Record<TimeOfDay, readonly string[]>;
  onCue: (kind: PlaceAction) => void;
  onNotice: (message: string) => void;
  onCompanion: (panel: CompanionPanelKind) => void;
  onFishing: () => void;
  onDialog: (dialog: Dialog) => void;
  onFriend: (activity: FriendActivity) => void;
  onMemory: (memory: Memory) => void;
}

export function nearbySpots(status: SceneStatus) {
  return {
    isNearAquarium: isNearSpot('aquarium', status, status.region),
    isNearCat: isNearSpot('cat', status, status.region),
    isAtPier: isNearSpot('pier', status, status.region),
    isNearDesk: isNearSpot('desk', status, status.region),
    isNearWardrobe: isNearSpot('wardrobe', status, status.region),
    isNearBoard: isNearSpot('board', status, status.region),
  };
}

export type NearbySpots = ReturnType<typeof nearbySpots>;

export function useWalkInteraction(options: WalkInteractionOptions) {
  const { engineRef, status, isPaused, timeOfDay, pages, onCue, onNotice } = options;
  const { onCompanion, onFishing, onDialog, onFriend, onMemory } = options;
  const spots = nearbySpots(status);
  const nearbyFriend = SCHOOLMATES.find((friend) => friend.id === status.schoolmateId);

  function playAction(landmark: Landmark) {
    if (!engineRef.current?.playAction(landmark.action.kind, landmark)) return;
    onCue(landmark.action.kind);
    onNotice(landmark.action.caption);
  }

  const spotActions: { isNear: boolean; run: () => void }[] = [
    {
      isNear: spots.isNearAquarium || spots.isNearCat,
      run: () => onCompanion(spots.isNearAquarium ? COMPANION_PANEL.aquarium : COMPANION_PANEL.cat),
    },
    { isNear: spots.isAtPier, run: () => onFishing() },
    { isNear: spots.isNearWardrobe, run: () => onDialog(DIALOG.wardrobe) },
    { isNear: spots.isNearDesk, run: () => onDialog(DIALOG.journal) },
    { isNear: spots.isNearBoard, run: () => onDialog(DIALOG.chalkboard) },
  ];

  function interactWithLandmark(landmark: Landmark) {
    if (pages[timeOfDay].includes(landmark.id)) {
      playAction(landmark);
      return;
    }
    onMemory(liveMemory(landmark, timeOfDay));
    pageStores[timeOfDay].add(landmark.id);
    onDialog(DIALOG.memory);
  }

  function interact() {
    if (isPaused) return;
    const spotAction = spotActions.find((action) => action.isNear);
    if (spotAction) {
      spotAction.run();
      return;
    }
    if (nearbyFriend && engineRef.current?.greetSchoolmate(nearbyFriend.id)) {
      onFriend({ kind: FRIEND_ACTIVITY.greeting, id: nearbyFriend.id });
      return;
    }
    if (status.nearby) interactWithLandmark(status.nearby);
  }

  function readMemory(id: string) {
    const landmark = LANDMARKS.find((p) => p.id === id);
    if (!landmark) return;
    const keptAt = TIME_ORDER.filter((time) => pages[time].includes(id));
    onMemory(diaryMemory(landmark, keptAt));
    onDialog(DIALOG.memory);
  }

  function promptHint(landmark: Landmark) {
    return pages[timeOfDay].includes(landmark.id) ? landmark.action.label : FIRST_LOOK_LABEL[timeOfDay];
  }

  return { spots, nearbyFriend, interact, readMemory, promptHint };
}
