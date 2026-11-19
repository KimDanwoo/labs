'use client';

import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { DIALOG, WEATHER } from '../config/walk';
import type { WalkEngine } from '../lib/scene';
import { useActivities } from '../model/hooks/useActivities';
import { useAmbience, useAmbienceScene } from '../model/hooks/useAmbience';
import { useCollection } from '../model/hooks/useCollection';
import { useEngineCommands } from '../model/hooks/useEngineCommands';
import { useIsFirstVisit } from '../model/hooks/useIsFirstVisit';
import { useShortcuts } from '../model/hooks/useShortcuts';
import { useToast } from '../model/hooks/useToast';
import { useVillageDay } from '../model/hooks/useVillageDay';
import { useWalkDialog } from '../model/hooks/useWalkDialog';
import { useWalkEngine } from '../model/hooks/useWalkEngine';
import { useWalkInteraction } from '../model/hooks/useWalkInteraction';
import { SCHOOL_REGION } from '../model/schoolmateRoster';
import { schoolRegion } from '../model/schoolmates';
import { appearanceStore } from '../model/store/appearance';
import type { Memory } from '../model/types/memory';
import { WORLDS } from '../model/world/worlds';
import { BottomBar } from './BottomBar';
import { GameHeader } from './GameHeader';
import { InteractPrompts } from './InteractPrompts';
import { LoadingOverlay } from './LoadingOverlay';
import { MobileControls } from './MobileControls';
import { ToolBar } from './ToolBar';
import { WalkActivities } from './WalkActivities';
import { WalkDialogs } from './WalkDialogs';

interface WalkProps {
  children?: ReactNode;
}

export function Walk({ children }: WalkProps) {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const engine = useRef<WalkEngine | null>(null);
  const [isSprinting, setIsSprinting] = useState(false);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [hasGuided, setHasGuided] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const appearance = useSyncExternalStore(appearanceStore.subscribe, appearanceStore.get, appearanceStore.getServer);
  const activities = useActivities(engine, focusScene);
  const isBusy = isSleeping || activities.isActive;
  const { dialog, setDialog, closeDialog, closeAtlas, openDialog } = useWalkDialog(isBusy, focusScene);
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
  const friendRegion = schoolRegion(status.region);

  function focusScene() {
    landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }

  const { spots, nearbyFriend, interact, readMemory, promptHint } = useWalkInteraction({
    engineRef: engine,
    status,
    isPaused,
    timeOfDay,
    pages: collection.pages,
    onCue: ambience.cue,
    onNotice: toast.notify,
    onCompanion: activities.openCompanion,
    onFishing: activities.startFishing,
    onDialog: setDialog,
    onFriend: activities.startFriend,
    onMemory: setMemory,
  });

  const { changeAppearance, guideTo, returnHome, takePhoto } = useEngineCommands({
    engineRef: engine,
    onNotice: toast.notify,
    onGuided: () => setHasGuided(true),
    onCloseAtlas: closeAtlas,
  });
  useShortcuts({ isEnabled: !isPaused, onDiscover: interact, onOpenMap: () => setDialog(DIALOG.map) });

  return (
    <main
      className={`walk ${activities.isActive ? 'is-fishing' : ''} is-${timeOfDay} ${isRaining ? 'is-raining' : ''} ${hasStarted ? 'has-started' : ''}`}
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

      <InteractPrompts
        isPaused={isPaused}
        spots={spots}
        friendName={nearbyFriend?.name}
        nearby={status.nearby}
        promptHint={promptHint}
        onInteract={interact}
      />
      <WalkActivities
        engine={engine}
        companionPanel={activities.companionPanel}
        isFishing={activities.isFishing}
        friendActivity={activities.friendActivity}
        activeFriend={activities.activeFriend}
        friendRegion={friendRegion}
        timeOfDay={timeOfDay}
        canPlayBall={status.region === SCHOOL_REGION.yard && !isRaining}
        onFishingSound={ambience.fishingCue}
        onCloseCompanion={activities.closeCompanion}
        onCloseFishing={activities.closeFishing}
        onPlayBall={activities.playBall}
        onCloseFriend={activities.closeFriend}
      />

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

      <WalkDialogs
        dialog={dialog}
        isReady={isReady}
        isSleeping={isSleeping}
        status={status}
        collection={collection}
        memory={memory}
        appearance={appearance}
        onCloseAtlas={closeAtlas}
        onGuide={guideTo}
        onRead={readMemory}
        onReset={returnHome}
        onWake={today.wakeUp}
        onSleepDone={() => {
          engine.current?.finishSleep();
          setIsSleeping(false);
          focusScene();
        }}
        onClose={closeDialog}
        onChangeAppearance={changeAppearance}
      />
      {children}
    </main>
  );
}
