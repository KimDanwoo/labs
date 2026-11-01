'use client';

import { diaryMemory, liveMemory } from '@features/walk/lib/memory';
import { DIALOG, TIME_ORDER, WEATHER, type Dialog, type TimeOfDay } from '@features/walk/model/constants';
import {
  useAmbience,
  useAmbienceScene,
  useCollection,
  useIsFirstVisit,
  useShortcuts,
  useToast,
  useVillageDay,
  useWalkEngine,
} from '@features/walk/model/hooks';
import { appearanceStore, pageStores } from '@features/walk/model/store';
import type { Memory } from '@features/walk/model/types';
import type { Appearance } from '@shared/world/appearance';
import { HOME_DESK, HOME_WARDROBE, LANDMARKS, WORLDS, type Landmark } from '@shared/world/world';
import { useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { BottomBar } from './BottomBar';
import { FishingDialog } from './FishingDialog';
import { GameHeader } from './GameHeader';
import { InteractPrompt } from './InteractPrompt';
import { LoadingOverlay } from './LoadingOverlay';
import { MapDialog } from './MapDialog';
import { MemoryDialog } from './MemoryDialog';
import { MobileControls } from './MobileControls';
import { SleepTransition } from './SleepTransition';
import { ToolBar } from './ToolBar';
import { WardrobeDialog } from './WardrobeDialog';

const FIRST_LOOK = {
  day: '잠깐 머물러 보기',
  evening: '노을빛으로 머물러 보기',
  night: '밤의 풍경 바라보기',
} satisfies Record<TimeOfDay, string>;

export function Walk() {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const [isSprinting, setIsSprinting] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(DIALOG.none);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [hasGuided, setHasGuided] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const appearance = useSyncExternalStore(appearanceStore.subscribe, appearanceStore.get, appearanceStore.getServer);
  const [isFishing, setIsFishing] = useState(false);
  const isPaused = dialog !== DIALOG.none || isSleeping || isFishing;
  const today = useVillageDay(isPaused);
  const timeOfDay = today.time;
  const weather = today.weather;
  const isRaining = weather === WEATHER.rain;
  const toast = useToast();
  const collection = useCollection();
  const isFirstVisit = useIsFirstVisit();
  const ambience = useAmbience(() => toast.notify('이 브라우저에서는 소리를 재생할 수 없어요.'));
  const { engine, isReady, error, status, hasWalked } = useWalkEngine(landscapeRef, {
    appearance,
    timeOfDay,
    weather,
    isSprinting,
    isPaused,
    onNotice: toast.notify,
    onStep: ambience.step,
    onSleep: () => setIsSleeping(true),
  });
  useAmbienceScene(ambience.setScene, { region: status.region, time: timeOfDay, weather });
  const hasStarted = hasWalked || hasGuided;

  const isNearDesk = status.region === 'home' && Math.hypot(status.x - HOME_DESK.x, status.z - HOME_DESK.z) < 4.5;
  const isNearWardrobe =
    status.region === 'home' && Math.hypot(status.x - HOME_WARDROBE.x, status.z - HOME_WARDROBE.z) < 4.5;

  async function changeAppearance(next: Appearance) {
    if (!(await engine.current?.setAppearance(next))) return false;
    appearanceStore.set(next);
    return true;
  }

  function interact() {
    if (isPaused) return;
    if (isNearWardrobe) {
      setDialog(DIALOG.wardrobe);
      return;
    }
    if (isNearDesk) {
      setDialog(DIALOG.journal);
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
    return collection.pages[timeOfDay].includes(landmark.id) ? landmark.action.label : FIRST_LOOK[timeOfDay];
  }
  function closeDialog(which: Dialog) {
    // Commit now: window-level shortcuts read this state and must not see a dialog the browser already closed.
    flushSync(() => setDialog((current) => (current === which ? DIALOG.none : current)));
    landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }
  function guideTo(id: string) {
    engine.current?.travelTo(id);
    setHasGuided(true);
    closeDialog(dialog === DIALOG.journal ? DIALOG.journal : DIALOG.map);
    toast.notify('길을 따라 걸어갈게요. 방향키를 누르면 직접 움직일 수 있어요.');
  }
  function returnHome() {
    engine.current?.reset();
    closeDialog(dialog === DIALOG.journal ? DIALOG.journal : DIALOG.map);
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
    <main className={`walk is-${timeOfDay} ${isRaining ? 'is-raining' : ''} ${hasStarted ? 'has-started' : ''}`}>
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
        isReady={isReady && !isSleeping}
        onToggleSound={ambience.toggle}
        onPhoto={takePhoto}
        onOpenMap={() => {
          if (!isSleeping) setDialog(DIALOG.map);
        }}
        onOpenWardrobe={() => {
          if (!isSleeping) setDialog(DIALOG.wardrobe);
        }}
      />

      {isNearDesk && !isPaused && <InteractPrompt landmark={HOME_DESK} hint="그림일기 펼치기" onInteract={interact} />}
      {isNearWardrobe && !isPaused && (
        <InteractPrompt landmark={HOME_WARDROBE} hint="옷 갈아입기" onInteract={interact} />
      )}
      {status.nearby && !isPaused && (
        <InteractPrompt landmark={status.nearby} hint={promptHint(status.nearby)} onInteract={interact} />
      )}

      {status.nearby?.id === 'sea' && !isPaused && (
        <button className="fishing-open" onClick={() => setIsFishing(true)}>
          🎣 바다 낚시
        </button>
      )}
      {isFishing && (
        <FishingDialog
          onClose={() => {
            setIsFishing(false);
            landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
          }}
        />
      )}

      <BottomBar
        isPaused={isSleeping}
        place={status.nearby?.short ?? WORLDS[status.region].name}
        visited={collection.visited}
        shouldShowHint={isFirstVisit && isReady && !hasStarted}
        onOpenJournal={() => {
          if (!isSleeping) setDialog(DIALOG.journal);
        }}
      />
      <MobileControls
        isReady={isReady}
        isPaused={isPaused}
        isSprinting={isSprinting}
        onInput={(key, pressed) => engine.current?.setInput(key, pressed)}
        onToggleSprint={() => setIsSprinting((value) => !value)}
      />

      <div className={`toast ${toast.message ? 'visible' : ''}`} role="status">
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
        onClose={() => closeDialog(dialog === DIALOG.journal ? DIALOG.journal : DIALOG.map)}
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
            landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
          }}
        />
      )}
      <MemoryDialog
        isOpen={dialog === DIALOG.memory}
        memory={memory}
        pageCount={collection.pageCount}
        onClose={() => closeDialog(DIALOG.memory)}
      />
      <WardrobeDialog
        isOpen={dialog === DIALOG.wardrobe}
        appearance={appearance}
        onChange={changeAppearance}
        onClose={() => closeDialog(DIALOG.wardrobe)}
      />
    </main>
  );
}
