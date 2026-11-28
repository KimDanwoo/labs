import { SoundToggle } from '@views/gostop/ui/SoundToggle';
import { SpeedSwitch } from '@views/gostop/ui/SpeedSwitch';

export function GostopSettings() {
  return (
    <div className="flex items-center gap-2">
      <SoundToggle />
      <SpeedSwitch />
    </div>
  );
}
