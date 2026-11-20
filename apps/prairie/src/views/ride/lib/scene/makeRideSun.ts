import { DirectionalLight, type Object3D } from 'three';
import { RIDE_SUN } from '../../config/rideSun';
import { SCENE_COLORS, SUN } from '../../config/scene';

export function makeRideSun(mobile: boolean, target: Object3D): DirectionalLight {
  const sun = new DirectionalLight(SCENE_COLORS.sunLight, SUN.intensity);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? RIDE_SUN.shadowMapSize.mobile : RIDE_SUN.shadowMapSize.desktop);
  Object.assign(sun.shadow.camera, RIDE_SUN.shadowCamera);
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = RIDE_SUN.normalBias;
  sun.shadow.bias = RIDE_SUN.bias;
  sun.shadow.radius = RIDE_SUN.radius;
  sun.target = target;
  return sun;
}
