import { LuVolume2, LuVolumeX } from 'react-icons/lu';

import { CircleButton } from '@shared/ui/circle-button';
import { SETTINGS_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function SoundToggle() {
  const { isMuted, toggleMute } = useGostopContext();

  return (
    <CircleButton
      size="l"
      aria-label={SETTINGS_COPY.sound}
      aria-pressed={!isMuted}
      title={isMuted ? SETTINGS_COPY.soundOff : SETTINGS_COPY.soundOn}
      onClick={toggleMute}
    >
      {isMuted ? <LuVolumeX aria-hidden="true" /> : <LuVolume2 aria-hidden="true" />}
    </CircleButton>
  );
}
