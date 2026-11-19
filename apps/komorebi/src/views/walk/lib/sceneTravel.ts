import * as THREE from 'three';
import { isAtHomeBed, isNearHomeBed } from '../model/world/interactions';
import { DESTINATIONS } from '../model/world/landmarks';
import { getWorldPortals, isInsidePortal, portalAt, type WorldPortal } from '../model/world/portals';
import { findRoute, nextRegionStep } from '../model/world/routing';
import { REGION, isIndoors, type Point, type Region } from '../model/world/world';
import { WORLDS } from '../model/world/worlds';
import { SCENERY_STYLE } from './breeze';
import { isAirborne } from './motion';
import { lampUniforms } from './nightLights';
import { nearbyRegions } from './regionPlates';
import type { SceneContext } from './sceneContext';
import { START_REGION } from './walkState';

const SEA_REGION: Region = REGION.coast;
const CHALK_REGION: Region = REGION.classroom;

export type SceneTravel = ReturnType<typeof createSceneTravel>;

export function createSceneTravel({ container, state, wake, parts, options: { onNotice, onSleep } }: SceneContext) {
  const { plates, waterMaps, background, bedRest, placeEffects, jump, slide, keys, portalInput } = parts;
  const plan = (): WorldPortal | null => {
    if (!state.destination) return null;
    const point = DESTINATIONS.find((p) => p.id === state.destination);
    if (!point) return null;
    if (point.region === state.region) {
      state.route = findRoute(state.position, point, state.region);
      return null;
    }
    const portal = getWorldPortals(state.region).find((p) => p.to === nextRegionStep(state.region, point.region))!;
    state.route = findRoute(state.position, portal.center, state.region);
    return portal;
  };
  const redirect = (exit: WorldPortal | null) => {
    if (exit && exit === state.cancelledPortal) {
      state.blockedPortal = null;
      state.cancelledPortal = null;
      return;
    }
    if (!state.waitingPortal || state.waitingPortal === exit) return;
    state.blockedPortal = state.waitingPortal;
    state.cancelledPortal = state.waitingPortal;
    state.waitingPortal = null;
  };
  const switchRegion = (next: Region, spawn: Point, plate: THREE.Texture) => {
    if (isIndoors(state.region) || isIndoors(next)) {
      portalInput.arrive(keys);
      keys.clear();
      state.moveSpeed = 0;
    }
    jump.height = 0;
    jump.velocity = 0;
    jump.landing = 0;
    state.region = next;
    if (next === REGION.home) void bedRest.prepare(state.currentAppearance.character);
    slide.direction = null;
    slide.input = null;
    state.position = { ...spawn };
    state.route = [];
    background.uniforms.map!.value = plate;
    const lamps = lampUniforms(next);
    background.uniforms.lamps!.value = lamps.values;
    background.uniforms.waterMap!.value = waterMaps.of(next);
    background.uniforms.isSea!.value = next === SEA_REGION ? 1 : 0;
    background.uniforms.isVillage!.value = next === REGION.village ? 1 : 0;
    background.uniforms.isHome!.value = next === REGION.home ? 1 : 0;
    background.uniforms.hasChalk!.value = next === CHALK_REGION ? 1 : 0;
    background.uniforms.sceneryStyle!.value = SCENERY_STYLE[next];
    background.uniforms.lampCount!.value = lamps.count;
    const nearby = [...new Set([START_REGION, ...nearbyRegions(next)])];
    plates.focus(nearby);
    state.transition = state.reducedMotion ? 1 : 0.25;
    state.blockedPortal = portalAt(state.position, state.region);
    state.waitingPortal = null;
    state.cancelledPortal = null;
    placeEffects.clear();
    plan();
    wake();
    container.dataset.region = next;
  };
  const enterPortal = (portal: WorldPortal) => {
    const plate = plates.get(portal.to);
    if (plate) {
      state.waitingPortal = null;
      switchRegion(portal.to, portal.spawn, plate);
      return;
    }
    if (state.waitingPortal === portal) return;
    state.waitingPortal = portal;
    onNotice(`${WORLDS[portal.to].name} 풍경을 펼치고 있어요…`);
    plates.ensure(portal.to).catch(() => {
      if (state.disposed || state.waitingPortal !== portal) return;
      state.waitingPortal = null;
      state.blockedPortal = portal;
      state.cancelledPortal = null;
      onNotice('풍경을 불러오지 못했어요. 길을 잠시 벗어났다가 다시 들어가 보세요.');
    });
  };
  async function startSleep() {
    const canSleep = () =>
      !state.disposed &&
      !state.paused &&
      state.region === REGION.home &&
      !isAirborne(jump) &&
      isAtHomeBed(state.position);
    if (state.preparingSleep || state.sleepBlocked || !canSleep()) return;
    state.preparingSleep = true;
    const template = state.currentAppearance.character;
    const ready = await bedRest.prepare(template);
    state.preparingSleep = false;
    if (!canSleep() || template !== state.currentAppearance.character) return;
    state.sleepBlocked = true;
    if (!ready) {
      onNotice('잠자리를 준비하지 못했어요. 잠시 벗어났다가 다시 와 주세요.');
      return;
    }
    state.sleeping = true;
    state.paused = true;
    keys.clear();
    state.route = [];
    state.destination = null;
    bedRest.start(state.position);
    onSleep();
    wake();
  }
  function arriveAt() {
    if (state.region !== REGION.home || !isNearHomeBed(state.position)) state.sleepBlocked = false;
    if (state.region === REGION.home && isAtHomeBed(state.position)) void startSleep();
    if (state.blockedPortal && !isInsidePortal(state.position, state.blockedPortal)) {
      state.blockedPortal = null;
      state.cancelledPortal = null;
    }
    const portal = portalAt(state.position, state.region);
    if (!portal) state.waitingPortal = null;
    else if (portal !== state.blockedPortal) enterPortal(portal);
  }
  return { plan, redirect, switchRegion, arriveAt };
}
