import { TIME_LABEL, type TimeOfDay } from '@features/walk/model/constants';
import { Icon } from './Icon';
import { TIME_ICON } from './timeIcon';

type Props = {
  timeOfDay: TimeOfDay;
  isRaining: boolean;
  isSoundOn: boolean;
  isReady: boolean;
  onToggleSound: () => void;
  onPhoto: () => void;
  onOpenMap: () => void;
};

export function ToolBar({ timeOfDay, isRaining, isSoundOn, isReady, onToggleSound, onPhoto, onOpenMap }: Props) {
  const soundLabel = isSoundOn ? '자연 소리 끄기' : '자연 소리 켜기';
  return (
    <nav className="tools" aria-label="산책 설정">
      <span
        className="weather-indicator"
        title={`${TIME_LABEL[timeOfDay]} · ${isRaining ? '지나가는 소나기' : '맑음'}`}
      >
        <Icon name={isRaining ? 'rain' : TIME_ICON[timeOfDay]} />
        <span className="sr-only">
          {TIME_LABEL[timeOfDay]} · {isRaining ? '비' : '맑음'}
        </span>
      </span>
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
