import { TIME_LABEL, type TimeOfDay } from '@features/walk/model/constants';
import { Icon } from './Icon';
import { TIME_ICON } from './timeIcon';

const TIME_TO = { day: '한낮으로', evening: '해 질 녘으로', night: '밤으로' } satisfies Record<TimeOfDay, string>;

type Props = {
  timeOfDay: TimeOfDay;
  nextTimeOfDay: TimeOfDay;
  isSoundOn: boolean;
  isReady: boolean;
  onNextTime: () => void;
  onToggleSound: () => void;
  onPhoto: () => void;
  onOpenMap: () => void;
};

export function ToolBar({
  timeOfDay,
  nextTimeOfDay,
  isSoundOn,
  isReady,
  onNextTime,
  onToggleSound,
  onPhoto,
  onOpenMap,
}: Props) {
  const timeLabel = `${TIME_TO[nextTimeOfDay]} 바꾸기 (지금 ${TIME_LABEL[timeOfDay]})`;
  const soundLabel = isSoundOn ? '자연 소리 끄기' : '자연 소리 켜기';
  return (
    <nav className="tools" aria-label="산책 설정">
      <button className="tool" title={timeLabel} aria-label={timeLabel} onClick={onNextTime}>
        <Icon name={TIME_ICON[timeOfDay]} />
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
