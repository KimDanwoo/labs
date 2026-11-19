import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { CHALKS } from '../config/chalkboard';
import { DIALOG } from '../config/walk';
import { CHALK_LAYER, CHALK_TOOL } from '../lib/chalkboard';
import { CHALK_NOTICE, useChalkPad, type ChalkBrush, type ChalkNotice } from '../model/hooks/useChalkPad';
import { useModal } from '../model/hooks/useModal';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { chalkboardStore } from '../model/store/chalkboard';
import { DialogHeading } from './DialogHeading';

export function WalkChalkboard() {
  const { dialog, closeDialog } = useWalkContext();
  const isOpen = dialog === DIALOG.chalkboard;
  const onClose = () => closeDialog(DIALOG.chalkboard);
  const ref = useModal(isOpen);
  const titleId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useSyncExternalStore(chalkboardStore.subscribe, chalkboardStore.get, chalkboardStore.getServer);
  const [brush, setBrush] = useState<ChalkBrush>('white');
  const [notice, setNotice] = useState<ChalkNotice | null>(null);
  const pad = useChalkPad(canvasRef, { strokes, brush, onNotice: setNotice });

  const handleReplace = (next: typeof strokes) => {
    setNotice(chalkboardStore.set(next) ? null : CHALK_NOTICE.unsaved);
  };

  return (
    <dialog
      className="map-dialog chalkboard-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <DialogHeading
        eyebrow="방학 중인 우리 교실"
        title="칠판에 낙서하기"
        titleId={titleId}
        closeLabel="칠판 닫기"
        onClose={onClose}
      />
      <p className="dialog-intro">분필을 골라 마음껏 그려 보세요. 그린 그림은 교실 칠판에 그대로 남아요.</p>
      <canvas
        className="chalk-pad"
        ref={canvasRef}
        width={CHALK_LAYER.width}
        height={CHALK_LAYER.height}
        role="img"
        aria-label="교실 칠판. 마우스나 손가락으로 끌어서 그려요."
        {...pad}
      />
      <div className="chalk-tools" role="group" aria-label="분필과 지우개">
        {CHALKS.map((chalk) => (
          <button
            key={chalk.id}
            className={`chalk-stick chalk-${chalk.id}`}
            aria-pressed={brush === chalk.id}
            onClick={() => setBrush(chalk.id)}
          >
            {chalk.name}
          </button>
        ))}
        <button
          className="chalk-stick chalk-eraser"
          aria-pressed={brush === CHALK_TOOL.eraser}
          onClick={() => setBrush(CHALK_TOOL.eraser)}
        >
          지우개
        </button>
        <span className="chalk-tools-gap" aria-hidden="true" />
        <button
          className="chalk-action"
          disabled={strokes.length === 0}
          onClick={() => handleReplace(strokes.slice(0, -1))}
        >
          되돌리기
        </button>
        <button className="chalk-action" disabled={strokes.length === 0} onClick={() => handleReplace([])}>
          전부 지우기
        </button>
      </div>
      <p className="chalk-notice" role="status">
        {notice}
      </p>
    </dialog>
  );
}
