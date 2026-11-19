'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { DIALOG, WEATHER } from '../../config/walk';
import type { WalkEngine } from '../../lib/scene';
import { SCHOOL_REGION } from '../schoolmateRoster';
import { schoolRegion } from '../schoolmates';
import { appearanceStore } from '../store/appearance';
import type { Memory } from '../types/memory';
import { useActivities } from './useActivities';
import { useAmbience, useAmbienceScene } from './useAmbience';
import { useCollection } from './useCollection';
import { useEngineCommands } from './useEngineCommands';
import { useIsFirstVisit } from './useIsFirstVisit';
import { useShortcuts } from './useShortcuts';
import { useToast } from './useToast';
import { useVillageDay } from './useVillageDay';
import { useWalkDialog } from './useWalkDialog';
import { useWalkEngine } from './useWalkEngine';
import { useWalkInteraction } from './useWalkInteraction';

export type WalkModel = ReturnType<typeof useWalk>;

export function useWalk() {
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

  function focusScene() {
    landscapeRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }

  const interaction = useWalkInteraction({
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

  const commands = useEngineCommands({
    engineRef: engine,
    onNotice: toast.notify,
    onGuided: () => setHasGuided(true),
    onCloseAtlas: closeAtlas,
  });
  useShortcuts({ isEnabled: !isPaused, onDiscover: interaction.interact, onOpenMap: () => setDialog(DIALOG.map) });

  return {
    landscapeRef,
    engine,
    appearance,
    activities,
    ambience,
    collection,
    toast,
    today,
    timeOfDay,
    isRaining,
    isFirstVisit,
    isReady,
    error,
    status,
    hasStarted,
    isBusy,
    isPaused,
    isSprinting,
    isSleeping,
    memory,
    dialog,
    closeDialog,
    closeAtlas,
    openDialog,
    friendRegion: schoolRegion(status.region),
    canPlayBall: status.region === SCHOOL_REGION.yard && !isRaining,
    toggleSprint: () => setIsSprinting((value) => !value),
    finishSleep: () => {
      engine.current?.finishSleep();
      setIsSleeping(false);
      focusScene();
    },
    ...interaction,
    ...commands,
  };
}
