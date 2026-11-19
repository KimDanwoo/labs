import type { RefObject } from 'react';
import type { WalkEngine } from '../../lib/scene';
import { appearanceStore } from '../store/appearance';
import type { Appearance } from '../world/appearance';

interface EngineCommandOptions {
  engineRef: RefObject<WalkEngine | null>;
  onNotice: (message: string) => void;
  onGuided: () => void;
  onCloseAtlas: () => void;
}

export function useEngineCommands({ engineRef, onNotice, onGuided, onCloseAtlas }: EngineCommandOptions) {
  async function changeAppearance(next: Appearance) {
    if (!(await engineRef.current?.setAppearance(next))) return false;
    appearanceStore.set(next);
    return true;
  }
  function guideTo(id: string) {
    engineRef.current?.travelTo(id);
    onGuided();
    onCloseAtlas();
    onNotice('길을 따라 걸어갈게요. 방향키를 누르면 직접 움직일 수 있어요.');
  }
  function returnHome() {
    engineRef.current?.reset();
    onCloseAtlas();
    onNotice('처음 출발했던 마을 입구로 돌아왔어요.');
  }
  async function takePhoto() {
    const isSaved = await engineRef.current?.photo();
    onNotice(isSaved ? '오늘의 여름을 사진으로 간직했어요.' : '사진을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  return { changeAppearance, guideTo, returnHome, takePhoto };
}
