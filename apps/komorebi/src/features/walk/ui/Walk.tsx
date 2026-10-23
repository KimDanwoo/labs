'use client';

import { diaryMemory, liveMemory } from '@features/walk/lib/memory';
import { DIALOG, TIME, TIME_ORDER, type Dialog, type TimeOfDay } from '@features/walk/model/constants';
import {
  useAmbience,
  useAmbienceScene,
  useCollection,
  useIsFirstVisit,
  useShortcuts,
  useToast,
  useWalkEngine,
} from '@features/walk/model/hooks';
import { pageStores } from '@features/walk/model/store';
import type { Memory } from '@features/walk/model/types';
import { LANDMARKS, WORLDS } from '@shared/world/world';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { BottomBar } from './BottomBar';
import { GameHeader } from './GameHeader';
import { InteractPrompt } from './InteractPrompt';
import { LoadingOverlay } from './LoadingOverlay';
import { MapDialog } from './MapDialog';
import { MemoryDialog } from './MemoryDialog';
import { MobileControls } from './MobileControls';
import { ToolBar } from './ToolBar';

const FIRST_LOOK = {
  day: '잠깐 머물러 보기',
  evening: '노을빛으로 머물러 보기',
  night: '밤의 풍경 바라보기',
} satisfies Record<TimeOfDay, string>;

const nextTime = (time: TimeOfDay) => TIME_ORDER[(TIME_ORDER.indexOf(time) + 1) % TIME_ORDER.length]!;

export function Walk() {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(TIME.day);
  const [isSprinting, setIsSprinting] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(DIALOG.none);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [hasGuided, setHasGuided] = useState(false);
  const isPaused = dialog !== DIALOG.none;
  const toast = useToast();
  const collection = useCollection();
  const isFirstVisit = useIsFirstVisit();
  const ambience = useAmbience(() => toast.notify('이 브라우저에서는 소리를 재생할 수 없어요.'));
  const { engine, isReady, error, status, hasWalked } = useWalkEngine(landscapeRef, {
    timeOfDay,
    isSprinting,
    isPaused,
    onNotice: toast.notify,
    onStep: ambience.step,
  });
  useAmbienceScene(ambience.setScene, status.region, timeOfDay);
  const hasStarted = hasWalked || hasGuided;

  function openMemory() {
    const landmark = status.nearby;
    if (!landmark) return;
    setMemory(liveMemory(landmark, timeOfDay));
    pageStores[timeOfDay].add(landmark.id);
    setDialog(DIALOG.memory);
  }
  function readMemory(id: string) {
    const landmark = LANDMARKS.find((p) => p.id === id);
    if (!landmark) return;
    const keptAt = TIME_ORDER.filter((time) => collection.pages[time].includes(id));
    setMemory(diaryMemory(landmark, keptAt));
    setDialog(DIALOG.memory);
  }
  function promptHint(id: string) {
    return collection.pages[timeOfDay].includes(id) ? '추억 다시 읽기' : FIRST_LOOK[timeOfDay];
  }
  function closeDialog(which: Dialog) {
    // Commit now: window-level shortcuts read this state and must not see a dialog the browser already closed.
    flushSync(() => setDialog((current) => (current === which ? DIALOG.none : current)));
    landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }
  function guideTo(id: string) {
    engine.current?.travelTo(id);
    setHasGuided(true);
    closeDialog(DIALOG.map);
    toast.notify('길을 따라 걸어갈게요. 방향키를 누르면 직접 움직일 수 있어요.');
  }
  function returnHome() {
    engine.current?.reset();
    closeDialog(DIALOG.map);
    toast.notify('처음 출발했던 마을 입구로 돌아왔어요.');
  }
  async function takePhoto() {
    const isSaved = await engine.current?.photo();
    toast.notify(
      isSaved ? '오늘의 여름을 사진으로 간직했어요.' : '사진을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  }
  useShortcuts({ isEnabled: !isPaused, onDiscover: openMemory, onOpenMap: () => setDialog(DIALOG.map) });

  return (
    <main className={`walk is-${timeOfDay} ${hasStarted ? 'has-started' : ''}`}>
      <div className="landscape" ref={landscapeRef} />
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <GameHeader timeOfDay={timeOfDay} />
      <p className="sr-only" aria-live="polite">
        {WORLDS[status.region].name}
      </p>
      <div className="scene-caption" key={status.region} aria-hidden="true">
        <span>—</span> {WORLDS[status.region].name} <span>—</span>
      </div>
      <ToolBar
        timeOfDay={timeOfDay}
        nextTimeOfDay={nextTime(timeOfDay)}
        isSoundOn={ambience.isOn}
        isReady={isReady}
        onNextTime={() => setTimeOfDay(nextTime)}
        onToggleSound={ambience.toggle}
        onPhoto={takePhoto}
        onOpenMap={() => setDialog(DIALOG.map)}
      />

      {!hasStarted && isReady && (
        <div className="start-hint">
          <span className="hint-spark">✧</span> 어디로 가 볼까? 길을 눌러 걸어 보고, 길 끝을 넘어 이웃 마을로 가 봐!{' '}
          <span className="hint-spark">✧</span>
        </div>
      )}
      {status.nearby && !isPaused && (
        <InteractPrompt landmark={status.nearby} hint={promptHint(status.nearby.id)} onInteract={openMemory} />
      )}

      <BottomBar
        place={status.nearby?.short ?? WORLDS[status.region].name}
        visited={collection.visited}
        shouldShowHint={isFirstVisit && isReady && !hasStarted}
        onOpenJournal={() => setDialog(DIALOG.map)}
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
        isOpen={dialog === DIALOG.map}
        isReady={isReady}
        region={status.region}
        position={status}
        steps={status.steps}
        collection={collection}
        onClose={() => closeDialog(DIALOG.map)}
        onGuide={guideTo}
        onRead={readMemory}
        onReset={returnHome}
      />
      <MemoryDialog
        isOpen={dialog === DIALOG.memory}
        memory={memory}
        pageCount={collection.pageCount}
        onClose={() => closeDialog(DIALOG.memory)}
      />
    </main>
  );
}
