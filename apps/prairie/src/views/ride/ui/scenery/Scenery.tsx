import { Haze } from './Haze';
import { MeadowMotes } from './MeadowMotes';
import { Sky } from './Sky';

// 로컬 HDR 하늘과 미리 구운 능선, 가까운 빛 입자로 대기 원근을 만든다.
export function Scenery() {
  return (
    <>
      <Sky />
      <Haze />
      <MeadowMotes />
    </>
  );
}
