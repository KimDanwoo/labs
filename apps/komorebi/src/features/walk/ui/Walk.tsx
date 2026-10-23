'use client';

import { DIALOG, type Dialog } from '@features/walk/model/constants';
import {
  useAmbience,
  useDiscoveries,
  useIsFirstVisit,
  useShortcuts,
  useToast,
  useWalkEngine,
} from '@features/walk/model/hooks';
import { addDiscovery } from '@features/walk/model/store';
import { WORLDS, type Landmark } from '@shared/world/world';
import { useRef, useState } from 'react';
import { BottomBar } from './BottomBar';
import { GameHeader } from './GameHeader';
import { InteractPrompt } from './InteractPrompt';
import { LoadingOverlay } from './LoadingOverlay';
import { MapDialog } from './MapDialog';
import { MemoryDialog } from './MemoryDialog';
import { MobileControls } from './MobileControls';
import { ToolBar } from './ToolBar';

export function Walk() {
  const landscapeRef = useRef<HTMLDivElement>(null);
  const [isEvening, setIsEvening] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(DIALOG.none);
  const [memory, setMemory] = useState<Landmark | null>(null);
  const [hasGuided, setHasGuided] = useState(false);
  const toast = useToast();
  const visited = useDiscoveries();
  const isFirstVisit = useIsFirstVisit();
  const ambience = useAmbience(() => toast.notify('이 브라우저에서는 소리를 재생할 수 없어요.'));
  const { engine, isReady, error, status, hasWalked } = useWalkEngine(landscapeRef, { isEvening, isSprinting });
  const hasStarted = hasWalked || hasGuided;
  const isDialogOpen = dialog !== DIALOG.none;

  function openMemory() {
    if (!status.nearby) return;
    setMemory(status.nearby);
    addDiscovery(status.nearby.id);
    setDialog(DIALOG.memory);
  }
  function closeDialog(which: Dialog) {
    setDialog((current) => (current === which ? DIALOG.none : current));
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
  useShortcuts({ isEnabled: !isDialogOpen, onDiscover: openMemory, onOpenMap: () => setDialog(DIALOG.map) });

  return (
    <main className={`walk ${isEvening ? 'is-evening' : ''} ${hasStarted ? 'has-started' : ''}`}>
      <div className="landscape" ref={landscapeRef} />
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <GameHeader isEvening={isEvening} />
      <div className="scene-caption" key={status.region}>
        <span>—</span> {WORLDS[status.region].name} <span>—</span>
      </div>
      <ToolBar
        isEvening={isEvening}
        isSoundOn={ambience.isOn}
        isReady={isReady}
        onToggleEvening={() => setIsEvening((value) => !value)}
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
      {status.nearby && !isDialogOpen && (
        <InteractPrompt
          landmark={status.nearby}
          isCollected={visited.includes(status.nearby.id)}
          onInteract={openMemory}
        />
      )}

      <BottomBar
        place={status.nearby?.short ?? WORLDS[status.region].name}
        visited={visited}
        shouldShowHint={isFirstVisit && isReady && !hasStarted}
        onOpenJournal={() => setDialog(DIALOG.map)}
      />
      <MobileControls
        isReady={isReady}
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
        visited={visited}
        onClose={() => closeDialog(DIALOG.map)}
        onGuide={guideTo}
        onReset={returnHome}
      />
      <MemoryDialog
        isOpen={dialog === DIALOG.memory}
        memory={memory}
        collectedCount={visited.length}
        onClose={() => closeDialog(DIALOG.memory)}
      />
    </main>
  );
}
