import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { CHALK_LAYER, CHALK_TOOL, type ChalkColor } from '../lib/chalkboard';
import { CHALK_NOTICE, useChalkPad, type ChalkBrush, type ChalkNotice } from '../model/hooks/useChalkPad';
import { useModal } from '../model/hooks/useModal';
import { chalkboardStore } from '../model/store/chalkboard';
import { Icon } from './Icon';

type Props = { isOpen: boolean; onClose: () => void };

const CHALKS: { id: ChalkColor; name: string }[] = [
  { id: 'white', name: '흰 분필' },
  { id: 'yellow', name: '노란 분필' },
  { id: 'pink', name: '분홍 분필' },
];

export function ChalkboardDialog({ isOpen, onClose }: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useSyncExternalStore(chalkboardStore.subscribe, chalkboardStore.get, chalkboardStore.getServer);
  const [brush, setBrush] = useState<ChalkBrush>('white');
  const [notice, setNotice] = useState<ChalkNotice | null>(null);
  const pad = useChalkPad(canvasRef, { strokes, brush, onNotice: setNotice });

  function replace(next: typeof strokes) {
    setNotice(chalkboardStore.set(next) ? null : CHALK_NOTICE.unsaved);
  }

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
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">방학 중인 우리 교실</span>
          <h2 id={titleId}>칠판에 낙서하기</h2>
        </div>
        <button className="tool" aria-label="칠판 닫기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
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
        <button className="chalk-action" disabled={strokes.length === 0} onClick={() => replace(strokes.slice(0, -1))}>
          되돌리기
        </button>
        <button className="chalk-action" disabled={strokes.length === 0} onClick={() => replace([])}>
          전부 지우기
        </button>
      </div>
      <p className="chalk-notice" role="status">
        {notice}
      </p>
    </dialog>
  );
}
