import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';

import { COMPANION_REACTION_MS } from '@views/walk/config/companion';
import {
  COMPANION_ACTION,
  COMPANION_PANEL,
  COMPANION_REACTION,
  FISH_HOME,
  catBond,
  type CompanionAction,
  type CompanionPanelKind,
  type CompanionReaction,
} from '@views/walk/lib/companions';
import { companionStore } from '@views/walk/model/store/companions';

interface CompanionPanelInput {
  kind: CompanionPanelKind;
  onClose: () => void;
  onReact: (reaction: CompanionReaction) => void;
}

function actionNote(action: CompanionAction) {
  if (action.kind === COMPANION_ACTION.share)
    return `삼색이가 다가와 고개를 비벼요. ${catBond(companionStore.get().friendship).name}!`;
  if (action.kind === COMPANION_ACTION.tank) return '새로운 보금자리! 수조에서 헤엄치기 시작했어요.';
  return '살림망으로 옮겼어요. 도감 기록은 그대로예요.';
}

export function useCompanionPanel({ kind, onClose, onReact }: CompanionPanelInput) {
  const state = useSyncExternalStore(companionStore.subscribe, companionStore.get, companionStore.getServer);
  const [message, setMessage] = useState('');
  const [isReacting, setIsReacting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    closeButtonRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!isReacting) return undefined;
    const timer = window.setTimeout(() => setIsReacting(false), COMPANION_REACTION_MS);
    return () => window.clearTimeout(timer);
  }, [isReacting]);
  const isTank = kind === COMPANION_PANEL.aquarium;

  function act(action: CompanionAction) {
    const result = companionStore.act(action);
    if (!result.changed) {
      setMessage('자리가 부족해요. 먼저 다른 물고기를 옮겨 주세요.');
      return;
    }
    if (action.kind === COMPANION_ACTION.share) onReact(COMPANION_REACTION.share);
    const note = actionNote(action);
    setMessage(result.saved ? note : `${note} 저장하지 못해 이번 산책에서만 유지돼요.`);
  }

  function react() {
    if (isReacting) return;
    setIsReacting(true);
    onReact(isTank ? COMPANION_REACTION.feed : COMPANION_REACTION.pet);
    setMessage(isTank ? '톡톡, 먹이를 뿌리니 물고기들이 모여들어요.' : '가만히 손을 내미니 삼색이가 고개를 기울여요.');
  }

  return {
    isTank,
    tank: state.fish.filter((fish) => fish.home === FISH_HOME.tank),
    bag: state.fish.filter((fish) => fish.home === FISH_HOME.bag),
    friendship: state.friendship,
    message,
    isReacting,
    closeButtonRef,
    act,
    react,
  };
}

export type CompanionPanelModel = ReturnType<typeof useCompanionPanel>;
export type CompanionFish = CompanionPanelModel['tank'][number];
