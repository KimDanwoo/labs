import { DIALOG, TIME_LABEL } from '@views/walk/config/walk';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { Icon } from '@views/walk/ui/Icon';
import { TIME_ICON } from '@views/walk/ui/timeIcon';

export function WalkToolBar() {
  const { timeOfDay, isRaining, ambience, isReady: isSceneReady, isBusy, takePhoto, openDialog } = useWalkContext();
  const isSoundOn = ambience.isOn;
  const isReady = isSceneReady && !isBusy;
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
        onClick={ambience.toggle}
      >
        <Icon name={isSoundOn ? 'sound' : 'mute'} />
      </button>
      <span className="tool-divider" />
      <button
        className="tool"
        title="산책 옷 고르기"
        aria-label="산책 옷 고르기"
        disabled={!isReady}
        onClick={() => openDialog(DIALOG.wardrobe)}
      >
        <Icon name="shirt" />
      </button>
      <button
        className="tool"
        title="풍경 사진 저장"
        aria-label="풍경 사진 저장"
        disabled={!isReady}
        onClick={takePhoto}
      >
        <Icon name="camera" />
      </button>
      <button
        className="tool"
        title="산책 지도 (M)"
        aria-label="산책 지도 열기"
        disabled={!isReady}
        onClick={() => openDialog(DIALOG.map)}
      >
        <Icon name="map" />
      </button>
    </nav>
  );
}
