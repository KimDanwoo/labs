import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { BITE_WAIT_MS, FISHING_FAILURE, PERFECT_HOOK_WINDOW_MS, VIBRATION } from '../../config/fishing';
import { MS_PER_SECOND } from '../../config/time';
import type { createAmbience } from '../../lib/audio';
import { CATCH_CELEBRATION_SECONDS } from '../../lib/catchCelebration';
import { COMPANION_ACTION } from '../../lib/companions';
import {
  BITE_WINDOW_MS,
  CAST_SECONDS,
  FIGHT_OUTCOME,
  FISHING_PHASE,
  FISHING_STORAGE_KEY,
  addCatch,
  isBiteOnTime,
  isRareFish,
  parseCollection,
  rollCatch,
  type Catch,
  type Fight,
  type FishCollection,
  type FishingFrame,
  type FishingPhase,
} from '../../lib/fishing';
import { companionStore } from '../store/companions';

interface FishingSessionInput {
  onClose: () => void;
  onSound: ReturnType<typeof createAmbience>['fishingCue'];
  onFrame: (frame: FishingFrame | null) => void;
}

export function useFishingSession({ onClose, onSound, onFrame }: FishingSessionInput) {
  const [keptUid, setKeptUid] = useState<string | null>(null);
  const hasFinished = useRef(false);
  const [phase, setPhase] = useState<FishingPhase>(FISHING_PHASE.casting);
  const [caught, setCaught] = useState<Catch | null>(null);
  const [collection, setCollection] = useState<FishCollection>(() => {
    try {
      return parseCollection(localStorage.getItem(FISHING_STORAGE_KEY));
    } catch {
      return {};
    }
  });
  const [isNew, setIsNew] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [failure, setFailure] = useState<string>(FISHING_FAILURE.default);
  const deadline = useRef(0);
  const hasReeled = useRef(false);
  const publish = useEffectEvent(onFrame);
  const playSound = useEffectEvent(() => {
    if (phase === FISHING_PHASE.casting) onSound('cast');
    else if (phase === FISHING_PHASE.waiting) onSound('waiting');
    else if (phase === FISHING_PHASE.bite) {
      onSound('bite');
      navigator.vibrate?.([...VIBRATION.bite]);
    } else if (phase === FISHING_PHASE.fighting) onSound('hook');
    else if (phase === FISHING_PHASE.caught) onSound(caught && isRareFish(caught.id) ? 'rare' : 'success');
    else if (phase === FISHING_PHASE.missed) onSound('miss');
  });
  useEffect(() => {
    playSound();
  }, [phase]);
  useEffect(() => {
    if (phase !== FISHING_PHASE.fighting)
      publish({ phase, elapsed: 0, tension: 0, progress: 0, isReeling: false, caught });
  }, [phase, caught]);
  useEffect(() => () => publish(null), []);
  useEffect(() => {
    if (phase === FISHING_PHASE.caught) {
      const timer = window.setTimeout(() => setIsCelebrating(false), CATCH_CELEBRATION_SECONDS * MS_PER_SECOND);
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.casting) {
      const timer = window.setTimeout(() => setPhase(FISHING_PHASE.waiting), CAST_SECONDS * MS_PER_SECOND);
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.waiting) {
      const timer = window.setTimeout(
        () => {
          deadline.current = Date.now() + BITE_WINDOW_MS;
          setPhase(FISHING_PHASE.bite);
        },
        BITE_WAIT_MS.min + Math.random() * BITE_WAIT_MS.range,
      );
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.bite) {
      const timer = window.setTimeout(() => setPhase(FISHING_PHASE.missed), Math.max(0, deadline.current - Date.now()));
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  function finishFight(outcome: Fight['outcome']) {
    if (hasFinished.current) return;
    hasFinished.current = true;
    if (outcome !== FIGHT_OUTCOME.landed || !caught) {
      setFailure(outcome === FIGHT_OUTCOME.snapped ? FISHING_FAILURE.snapped : FISHING_FAILURE.escaped);
      setPhase(FISHING_PHASE.missed);
      return;
    }
    const uid = crypto.randomUUID();
    const kept = companionStore.act({ kind: COMPANION_ACTION.keep, fish: caught, uid });
    setKeptUid(kept.changed ? uid : null);
    const updated = addCatch(collection, caught);
    setIsNew(!collection[caught.id]);
    setIsRecord(Boolean(collection[caught.id] && caught.size > collection[caught.id]!.best));
    setIsCelebrating(true);
    setCollection(updated);
    try {
      localStorage.setItem(FISHING_STORAGE_KEY, JSON.stringify(updated));
      setHasSaveError(!kept.saved);
    } catch {
      setHasSaveError(true);
    }
    setPhase(FISHING_PHASE.caught);
  }

  function act() {
    if (phase === FISHING_PHASE.fighting || phase === FISHING_PHASE.casting || isCelebrating) return;
    if (phase === FISHING_PHASE.waiting || phase === FISHING_PHASE.bite) {
      if (hasReeled.current) return;
      hasReeled.current = true;
      if (phase !== FISHING_PHASE.bite || !isBiteOnTime(Date.now(), deadline.current)) {
        setPhase(FISHING_PHASE.missed);
        return;
      }
      setIsPerfect(Date.now() < deadline.current - BITE_WINDOW_MS + PERFECT_HOOK_WINDOW_MS);
      setCaught(rollCatch());
      navigator.vibrate?.([...VIBRATION.hook]);
      setPhase(FISHING_PHASE.fighting);
      return;
    }
    setFailure(FISHING_FAILURE.default);
    hasReeled.current = false;
    hasFinished.current = false;
    setCaught(null);
    setIsRecord(false);
    setPhase(FISHING_PHASE.casting);
  }

  const handleAct = useEffectEvent(act);
  const handleClose = useEffectEvent(onClose);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        handleAct();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return {
    phase,
    caught,
    collection,
    keptUid,
    isNew,
    isRecord,
    isCelebrating,
    hasSaveError,
    isPerfect,
    failure,
    act,
    finishFight,
  };
}
