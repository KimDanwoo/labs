import type { ThreeElements } from '@react-three/fiber';
import { toonGradient } from './toonGradient';

type ToonMaterialProps = ThreeElements['meshToonMaterial'];

// 모든 표면의 공통 toon 셰이딩. gradientMap을 한곳에서 물려 일관된 밴딩을 보장한다.
export function ToonMaterial(props: ToonMaterialProps) {
  return <meshToonMaterial gradientMap={toonGradient} {...props} />;
}
