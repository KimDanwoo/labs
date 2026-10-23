import { Icon } from './Icon';

type Props = {
  isEvening: boolean;
  isSoundOn: boolean;
  isReady: boolean;
  onToggleEvening: () => void;
  onToggleSound: () => void;
  onPhoto: () => void;
  onOpenMap: () => void;
};

export function ToolBar({ isEvening, isSoundOn, isReady, onToggleEvening, onToggleSound, onPhoto, onOpenMap }: Props) {
  const eveningLabel = isEvening ? '한낮으로 바꾸기' : '노을로 바꾸기';
  const soundLabel = isSoundOn ? '자연 소리 끄기' : '자연 소리 켜기';
  return (
    <nav className="tools" aria-label="산책 설정">
      <button
        className="tool"
        title={eveningLabel}
        aria-label={eveningLabel}
        aria-pressed={isEvening}
        onClick={onToggleEvening}
      >
        <Icon name={isEvening ? 'moon' : 'sun'} />
      </button>
      <button
        className="tool"
        title={soundLabel}
        aria-label={soundLabel}
        aria-pressed={isSoundOn}
        onClick={onToggleSound}
      >
        <Icon name={isSoundOn ? 'sound' : 'mute'} />
      </button>
      <span className="tool-divider" />
      <button className="tool" title="풍경 사진 저장" aria-label="풍경 사진 저장" disabled={!isReady} onClick={onPhoto}>
        <Icon name="camera" />
      </button>
      <button className="tool" title="산책 지도 (M)" aria-label="산책 지도 열기" onClick={onOpenMap}>
        <Icon name="map" />
      </button>
    </nav>
  );
}
