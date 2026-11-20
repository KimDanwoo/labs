import { Haze } from '@views/ride/ui/scenery/Haze';
import { MeadowMotes } from '@views/ride/ui/scenery/MeadowMotes';
import { Sky } from '@views/ride/ui/scenery/Sky';

export function Scenery() {
  return (
    <>
      <Sky />
      <Haze />
      <MeadowMotes />
    </>
  );
}
