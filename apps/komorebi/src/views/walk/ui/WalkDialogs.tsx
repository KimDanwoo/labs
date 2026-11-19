import type { JSX } from 'react';
import { DIALOG, type Dialog } from '../config/walk';
import type { SceneStatus } from '../lib/scene';
import type { useCollection } from '../model/hooks/useCollection';
import type { Memory } from '../model/types/memory';
import type { Appearance } from '../model/world/appearance';
import { ChalkboardDialog } from './ChalkboardDialog';
import { MapDialog } from './MapDialog';
import { MemoryDialog } from './MemoryDialog';
import { SleepTransition } from './SleepTransition';
import { WardrobeDialog } from './WardrobeDialog';

interface WalkDialogsProps {
  dialog: Dialog;
  isReady: boolean;
  isSleeping: boolean;
  status: SceneStatus;
  collection: ReturnType<typeof useCollection>;
  memory: Memory | null;
  appearance: Appearance;
  onCloseAtlas: () => void;
  onGuide: (id: string) => void;
  onRead: (id: string) => void;
  onReset: () => void;
  onWake: () => void;
  onSleepDone: () => void;
  onClose: (which: Dialog) => void;
  onChangeAppearance: (next: Appearance) => Promise<boolean>;
}

export function WalkDialogs({
  dialog,
  isReady,
  isSleeping,
  status,
  collection,
  memory,
  appearance,
  onCloseAtlas,
  onGuide,
  onRead,
  onReset,
  onWake,
  onSleepDone,
  onClose,
  onChangeAppearance,
}: WalkDialogsProps): JSX.Element {
  return (
    <>
      <MapDialog
        isOpen={dialog === DIALOG.map || dialog === DIALOG.journal}
        isJournal={dialog === DIALOG.journal}
        isReady={isReady}
        region={status.region}
        position={status}
        steps={status.steps}
        collection={collection}
        onClose={onCloseAtlas}
        onGuide={onGuide}
        onRead={onRead}
        onReset={onReset}
      />
      {isSleeping && <SleepTransition onWake={onWake} onDone={onSleepDone} />}
      <MemoryDialog
        isOpen={dialog === DIALOG.memory}
        memory={memory}
        pageCount={collection.pageCount}
        onClose={() => onClose(DIALOG.memory)}
      />
      <ChalkboardDialog isOpen={dialog === DIALOG.chalkboard} onClose={() => onClose(DIALOG.chalkboard)} />
      <WardrobeDialog
        isOpen={dialog === DIALOG.wardrobe}
        appearance={appearance}
        onChange={onChangeAppearance}
        onClose={() => onClose(DIALOG.wardrobe)}
      />
    </>
  );
}
