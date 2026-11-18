'use client';

import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { DIALOG, FIRST_LOOK_LABEL, FRIEND_ACTIVITY, TIME_ORDER, WEATHER, type Dialog } from '../config/walk';
import { COMPANION_PANEL, type CompanionPanelKind } from '../lib/companions';
import { diaryMemory, liveMemory } from '../lib/memory';
import type { WalkEngine } from '../lib/scene';
import { useAmbience, useAmbienceScene } from '../model/hooks/useAmbience';
import { useCollection } from '../model/hooks/useCollection';
import { useIsFirstVisit } from '../model/hooks/useIsFirstVisit';
import { useShortcuts } from '../model/hooks/useShortcuts';
import { useToast } from '../model/hooks/useToast';
import { useVillageDay } from '../model/hooks/useVillageDay';
import { useWalkEngine } from '../model/hooks/useWalkEngine';
import { SCHOOL_REGION, SCHOOLMATES, schoolRegion, type SchoolmateId } from '../model/schoolmates';
import { appearanceStore } from '../model/store/appearance';
import { pageStores } from '../model/store/discoveries';
import type { Memory } from '../model/types/memory';
import type { Appearance } from '../model/world/appearance';
import { isNearSpot } from '../model/world/interactions';
import {
  CLASSROOM_BOARD,
  FISHING_PIER,
  HOME_AQUARIUM,
  HOME_DESK,
  HOME_WARDROBE,
  LANDMARKS,
  PIER_CAT,
  WORLDS,
  type Landmark,
} from '../model/world/world';
import { BallGameHud } from './BallGameHud';
import { BottomBar } from './BottomBar';
import { ChalkboardDialog } from './ChalkboardDialog';
import { CompanionPanel } from './CompanionPanel';
import { FishingHud } from './FishingHud';
import { GameHeader } from './GameHeader';
import { InteractPrompt } from './InteractPrompt';
import { LoadingOverlay } from './LoadingOverlay';
import { MapDialog } from './MapDialog';
import { MemoryDialog } from './MemoryDialog';
import { MobileControls } from './MobileControls';
import { SchoolmateDialog } from './SchoolmateDialog';
import { SleepTransition } from './SleepTransition';
import { ToolBar } from './ToolBar';
import { WardrobeDialog } from './WardrobeDialog';

type FriendActivity =
  | { kind: typeof FRIEND_ACTIVITY.none }
  | { kind: typeof FRIEND_ACTIVITY.greeting | typeof FRIEND_ACTIVITY.ball; id: SchoolmateId };

interface WalkProps {
  children?: ReactNode;
}

export function Walk({ children }: WalkProps) {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const engine = useRef<WalkEngine | null>(null);
  const [isSprinting, setIsSprinting] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(DIALOG.none);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [hasGuided, setHasGuided] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const appearance = useSyncExternalStore(appearanceStore.subscribe, appearanceStore.get, appearanceStore.getServer);
  const [companionPanel, setCompanionPanel] = useState<CompanionPanelKind>(COMPANION_PANEL.none);
  const isWithCompanion = companionPanel !== COMPANION_PANEL.none;
  const [isFishing, setIsFishing] = useState(false);
  const [friendActivity, setFriendActivity] = useState<FriendActivity>({ kind: FRIEND_ACTIVITY.none });
  const isWithFriend = friendActivity.kind !== FRIEND_ACTIVITY.none;
  const isBusy = isSleeping || isFishing || isWithCompanion || isWithFriend;
  const isPaused = dialog !== DIALOG.none || isBusy;
  const today = useVillageDay(isPaused);
  const timeOfDay = today.time;
  const weather = today.weather;
  const isRaining = weather === WEATHER.rain;
  const toast = useToast();
  const collection = useCollection();
  const isFirstVisit = useIsFirstVisit();
  const ambience = useAmbience(() => toast.notify('이 브라우저에서는 소리를 재생할 수 없어요.'));
  const { isReady, error, status, hasWalked } = useWalkEngine(
    landscapeRef,
    {
      appearance,
      timeOfDay,
      weather,
      isSprinting,
      isPaused,
      onNotice: toast.notify,
      onStep: ambience.step,
      onSleep: () => setIsSleeping(true),
    },
    engine,
  );
  useAmbienceScene(ambience.setScene, { region: status.region, time: timeOfDay, weather });
  const hasStarted = hasWalked || hasGuided;
  const nearbyFriend = SCHOOLMATES.find((friend) => friend.id === status.schoolmateId);
  const activeFriend =
    friendActivity.kind === FRIEND_ACTIVITY.none ? null : SCHOOLMATES.find((friend) => friend.id === friendActivity.id);
  const friendRegion = schoolRegion(status.region);

  function focusScene() {
    landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }

  function closeFriend() {
    engine.current?.endSchoolmateGreeting();
    flushSync(() => setFriendActivity({ kind: FRIEND_ACTIVITY.none }));
    focusScene();
  }

  const isNearAquarium = isNearSpot('aquarium', status, status.region);
  const isNearCat = isNearSpot('cat', status, status.region);
  const isAtPier = isNearSpot('pier', status, status.region);
  const isNearDesk = isNearSpot('desk', status, status.region);
  const isNearWardrobe = isNearSpot('wardrobe', status, status.region);
  const isNearBoard = isNearSpot('board', status, status.region);

  async function changeAppearance(next: Appearance) {
    if (!(await engine.current?.setAppearance(next))) return false;
    appearanceStore.set(next);
    return true;
  }

  function interact() {
    if (isPaused) return;
    if (isNearAquarium || isNearCat) {
      setCompanionPanel(isNearAquarium ? COMPANION_PANEL.aquarium : COMPANION_PANEL.cat);
      return;
    }
    if (isAtPier) {
      setIsFishing(true);
      return;
    }
    if (isNearWardrobe) {
      setDialog(DIALOG.wardrobe);
      return;
    }
    if (isNearDesk) {
      setDialog(DIALOG.journal);
      return;
    }
    if (isNearBoard) {
      setDialog(DIALOG.chalkboard);
      return;
    }
    if (nearbyFriend && engine.current?.greetSchoolmate(nearbyFriend.id)) {
      setFriendActivity({ kind: FRIEND_ACTIVITY.greeting, id: nearbyFriend.id });
      return;
    }
    const landmark = status.nearby;
    if (!landmark) return;
    if (collection.pages[timeOfDay].includes(landmark.id)) {
      playAction(landmark);
      return;
    }
    setMemory(liveMemory(landmark, timeOfDay));
    pageStores[timeOfDay].add(landmark.id);
    setDialog(DIALOG.memory);
  }
  function playAction(landmark: Landmark) {
    if (!engine.current?.playAction(landmark.action.kind, landmark)) return;
    ambience.cue(landmark.action.kind);
    toast.notify(landmark.action.caption);
  }
  function readMemory(id: string) {
    const landmark = LANDMARKS.find((p) => p.id === id);
    if (!landmark) return;
    const keptAt = TIME_ORDER.filter((time) => collection.pages[time].includes(id));
    setMemory(diaryMemory(landmark, keptAt));
    setDialog(DIALOG.memory);
  }
  function promptHint(landmark: Landmark) {
    return collection.pages[timeOfDay].includes(landmark.id) ? landmark.action.label : FIRST_LOOK_LABEL[timeOfDay];
  }
  function closeDialog(which: Dialog) {
    // Commit now: window-level shortcuts read this state and must not see a dialog the browser already closed.
    flushSync(() => setDialog((current) => (current === which ? DIALOG.none : current)));
    focusScene();
  }
  function closeAtlas() {
    closeDialog(dialog === DIALOG.journal ? DIALOG.journal : DIALOG.map);
  }
  function openDialog(next: Dialog) {
    if (!isBusy) setDialog(next);
  }
  function guideTo(id: string) {
    engine.current?.travelTo(id);
    setHasGuided(true);
    closeAtlas();
    toast.notify('길을 따라 걸어갈게요. 방향키를 누르면 직접 움직일 수 있어요.');
  }
  function returnHome() {
    engine.current?.reset();
    closeAtlas();
    toast.notify('처음 출발했던 마을 입구로 돌아왔어요.');
  }
  async function takePhoto() {
    const isSaved = await engine.current?.photo();
    toast.notify(
      isSaved ? '오늘의 여름을 사진으로 간직했어요.' : '사진을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  }
  useShortcuts({ isEnabled: !isPaused, onDiscover: interact, onOpenMap: () => setDialog(DIALOG.map) });

  return (
    <main
      className={`walk ${isFishing || isWithCompanion || isWithFriend ? 'is-fishing' : ''} is-${timeOfDay} ${isRaining ? 'is-raining' : ''} ${hasStarted ? 'has-started' : ''}`}
    >
      <div className="landscape" ref={landscapeRef} />
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <GameHeader timeOfDay={timeOfDay} day={today.day} />
      <p className="sr-only" aria-live="polite">
        {WORLDS[status.region].name}
      </p>
      <div className="scene-caption" key={status.region} aria-hidden="true">
        <span>—</span> {WORLDS[status.region].name} <span>—</span>
      </div>
      <ToolBar
        timeOfDay={timeOfDay}
        isRaining={isRaining}
        isSoundOn={ambience.isOn}
        isReady={isReady && !isBusy}
        onToggleSound={ambience.toggle}
        onPhoto={takePhoto}
        onOpenMap={() => openDialog(DIALOG.map)}
        onOpenWardrobe={() => openDialog(DIALOG.wardrobe)}
      />

      {isNearDesk && !isPaused && <InteractPrompt landmark={HOME_DESK} hint="그림일기 펼치기" onInteract={interact} />}
      {isNearWardrobe && !isPaused && (
        <InteractPrompt landmark={HOME_WARDROBE} hint="옷 갈아입기" onInteract={interact} />
      )}
      {isNearBoard && !isPaused && (
        <InteractPrompt landmark={CLASSROOM_BOARD} hint="칠판에 낙서하기" onInteract={interact} />
      )}
      {nearbyFriend && !isNearBoard && !isPaused && (
        <InteractPrompt landmark={{ name: nearbyFriend.name }} hint="친구에게 인사하기" onInteract={interact} />
      )}
      {status.nearby && !nearbyFriend && !isPaused && !isAtPier && !isNearCat && !isNearAquarium && !isNearBoard && (
        <InteractPrompt landmark={status.nearby} hint={promptHint(status.nearby)} onInteract={interact} />
      )}

      {isNearAquarium && !isPaused && (
        <InteractPrompt landmark={HOME_AQUARIUM} hint="물고기 만나기 · 먹이 주기" onInteract={interact} />
      )}
      {isNearCat && !isPaused && (
        <InteractPrompt landmark={PIER_CAT} hint="인사하기 · 물고기 나눠 주기" onInteract={interact} />
      )}
      {isWithCompanion && (
        <CompanionPanel
          key={companionPanel}
          kind={companionPanel}
          onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
          onClose={() => {
            setCompanionPanel(COMPANION_PANEL.none);
            focusScene();
          }}
        />
      )}
      {isAtPier && !isPaused && !isNearCat && (
        <InteractPrompt landmark={FISHING_PIER} hint="부두 끝에서 낚싯줄 던지기" onInteract={interact} />
      )}
      {isFishing && (
        <FishingHud
          onSound={ambience.fishingCue}
          onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
          onFrame={(frame) => engine.current?.setFishing(frame)}
          onClose={() => {
            engine.current?.setFishing(null);
            setIsFishing(false);
            focusScene();
          }}
        />
      )}

      {activeFriend && friendRegion && friendActivity.kind === FRIEND_ACTIVITY.greeting && (
        <SchoolmateDialog
          name={activeFriend.name}
          region={friendRegion}
          time={timeOfDay}
          canPlay={status.region === SCHOOL_REGION.yard && !isRaining}
          onPlay={() => setFriendActivity({ kind: FRIEND_ACTIVITY.ball, id: activeFriend.id })}
          onClose={closeFriend}
        />
      )}
      {activeFriend && friendActivity.kind === FRIEND_ACTIVITY.ball && (
        <BallGameHud
          name={activeFriend.name}
          onFrame={(frame) => engine.current?.setBallGame(frame) ?? false}
          onClose={closeFriend}
        />
      )}

      <BottomBar
        isPaused={isBusy}
        place={status.nearby?.short ?? WORLDS[status.region].name}
        visited={collection.visited}
        shouldShowHint={isFirstVisit && isReady && !hasStarted}
        onOpenJournal={() => openDialog(DIALOG.journal)}
      />
      <MobileControls
        isReady={isReady}
        isPaused={isPaused}
        isSprinting={isSprinting}
        onInput={(key, pressed) => engine.current?.setInput(key, pressed)}
        onToggleSprint={() => setIsSprinting((value) => !value)}
      />

      <div className={toast.message ? 'toast visible' : 'toast'} role="status" aria-label="산책 알림">
        {toast.message}
      </div>
      {!isReady && <LoadingOverlay error={error} />}

      <MapDialog
        isOpen={dialog === DIALOG.map || dialog === DIALOG.journal}
        isJournal={dialog === DIALOG.journal}
        isReady={isReady}
        region={status.region}
        position={status}
        steps={status.steps}
        collection={collection}
        onClose={closeAtlas}
        onGuide={guideTo}
        onRead={readMemory}
        onReset={returnHome}
      />
      {isSleeping && (
        <SleepTransition
          onWake={today.wakeUp}
          onDone={() => {
            engine.current?.finishSleep();
            setIsSleeping(false);
            focusScene();
          }}
        />
      )}
      <MemoryDialog
        isOpen={dialog === DIALOG.memory}
        memory={memory}
        pageCount={collection.pageCount}
        onClose={() => closeDialog(DIALOG.memory)}
      />
      <ChalkboardDialog isOpen={dialog === DIALOG.chalkboard} onClose={() => closeDialog(DIALOG.chalkboard)} />
      <WardrobeDialog
        isOpen={dialog === DIALOG.wardrobe}
        appearance={appearance}
        onChange={changeAppearance}
        onClose={() => closeDialog(DIALOG.wardrobe)}
      />
      {children}
    </main>
  );
}
