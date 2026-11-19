import * as THREE from 'three';
import { TIME, WEATHER, type TimeOfDay } from '../config/walk';
import { foregroundOrder } from '../model/world/foreground';
import { DESTINATIONS, isIndoors } from '../model/world/world';
import { lampGlowAt } from './nightLights';
import { sceneX, sceneY } from './perspective';
import { settle } from './renderBudget';
import type { SceneContext } from './sceneContext';
import { CHILD_ORDER } from './sceneSetup';

const WARMTH_EPSILON = 0.002;
const WARMTH_BY_TIME = { day: 0, evening: 1, night: 0.35 } satisfies Record<TimeOfDay, number>;

const easeLight = (current: number, target: number, lambda: number, dt: number) =>
  settle(THREE.MathUtils.damp(current, target, lambda, dt), target, WARMTH_EPSILON);

export function createWorldMotion({ container, state, parts }: SceneContext) {
  const {
    character,
    camera,
    background,
    child,
    foregrounds,
    markers,
    portalVisuals,
    fireflies,
    placeEffects,
    nightLights,
    life,
    roamers,
    schoolmates,
    waves,
    boats,
    countryside,
    leaves,
    rain,
    targetMarker,
  } = parts;
  function placeMarkers() {
    markers.forEach((marker, i) => {
      const point = DESTINATIONS[i]!;
      marker.visible = point.region === state.region && !state.sleeping;
      marker.position.y =
        sceneY(point.z) + 2 + (state.reducedMotion ? 0 : Math.sin(state.sceneryTime * 1.5 + i) * 0.17);
    });
    portalVisuals.update(state.region);
    targetMarker.visible = state.route.length > 0;
    if (state.route.length) {
      const target = state.route[state.route.length - 1]!;
      targetMarker.position.set(sceneX(target.x), sceneY(target.z) + 0.5, 1);
    }
  }
  function easeAtmosphere(dt: number) {
    const targetWarmth = WARMTH_BY_TIME[state.timeOfDay];
    const targetDarkness = state.timeOfDay === TIME.night ? 1 : 0;
    const targetWetness = state.weather === WEATHER.rain ? 1 : 0;
    state.warmth = easeLight(state.warmth, targetWarmth, 2, dt);
    state.darkness = easeLight(state.darkness, targetDarkness, 2, dt);
    state.wetness = easeLight(state.wetness, targetWetness, 1.5, dt);
    return state.warmth !== targetWarmth || state.darkness !== targetDarkness || state.wetness !== targetWetness;
  }
  function paintBackground(dt: number, size: number) {
    state.transition = Math.min(1, state.transition + dt * 1.8);
    background.uniforms.night!.value = state.darkness;
    background.uniforms.walker!.value.set((child.position.x + 60) / 120, (child.position.y + 40 + 1.8 * size) / 80);
    background.uniforms.rain!.value = isIndoors(state.region) ? 0 : state.wetness;
    background.uniforms.outdoorRain!.value = state.wetness;
    background.uniforms.time!.value = state.reducedMotion ? 0 : state.sceneryTime;
    background.uniforms.evening!.value = state.warmth;
    background.uniforms.fade!.value = state.transition;
  }
  function animateLife(worldDt: number, isResting: boolean) {
    const isRaining = state.wetness > 0.5;
    fireflies.update(state.sceneryTime, isIndoors(state.region) ? 0 : state.darkness, state.reducedMotion);
    nightLights.update(state.region, state.darkness, state.sceneryTime, state.reducedMotion);
    placeEffects.update(worldDt);
    rain.update(
      worldDt,
      isIndoors(state.region) ? 0 : state.wetness,
      camera.position,
      state.reducedMotion,
      state.darkness,
    );
    life.update({
      region: state.region,
      dt: worldDt,
      elapsed: state.sceneryTime,
      darkness: state.darkness,
      isStill: state.reducedMotion,
      isRaining,
    });
    waves.update({
      region: state.region,
      dt: worldDt,
      darkness: state.darkness,
      isStill: state.reducedMotion,
      rain: state.wetness,
    });
    boats.update({ region: state.region, dt: worldDt, darkness: state.darkness, isStill: state.reducedMotion });
    leaves.update(state.region, worldDt, state.darkness, state.wetness, state.reducedMotion);
    countryside.update({
      region: state.region,
      dt: worldDt,
      darkness: state.darkness,
      isStill: state.reducedMotion,
      isRaining,
      player: state.position,
    });
    roamers.update({
      region: state.region,
      dt: worldDt,
      darkness: state.darkness,
      isStill: state.reducedMotion,
      isRaining,
      childZ: state.position.z,
    });
    container.dataset.visitor = roamers.visitor;
    schoolmates.update({
      region: state.region,
      dt: state.paused ? 0 : worldDt,
      darkness: state.darkness,
      isStill: state.reducedMotion,
      isRaining,
      player: state.position,
    });
    container.dataset.schoolmates = String(schoolmates.standing.length);
    const walkers = [
      isResting ? null : { ...state.position, order: CHILD_ORDER },
      roamers.standing,
      ...schoolmates.standing,
    ].filter((walker) => walker !== null);
    foregrounds.forEach((layer) => {
      const order = foregroundOrder(layer, walkers, state.region);
      layer.mesh.visible = order !== null;
      layer.mesh.renderOrder = order ?? 0;
    });
    container.dataset.playerOccluders = String(
      foregrounds.filter((layer) => layer.mesh.visible && layer.mesh.renderOrder > CHILD_ORDER).length,
    );
    character.setLight(state.darkness, lampGlowAt(state.region, state.position));
  }
  return { placeMarkers, easeAtmosphere, paintBackground, animateLife };
}
