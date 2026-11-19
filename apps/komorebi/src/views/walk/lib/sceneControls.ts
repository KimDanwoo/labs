import { WEATHER } from '../config/walk';
import { BALL_PHASE } from '../model/ballGame';
import { schoolmateGreetingPosition, schoolmatePlayPosition } from '../model/schoolmates';
import { characterLayers } from '../model/world/appearance';
import { isNearSpot } from '../model/world/interactions';
import { REGION, SPAWN, findRoute } from '../model/world/world';
import { CANVAS_FONT_FAMILY } from './art';
import type { createChalkLayer } from './chalkLayer';
import { startJump } from './motion';
import { preparePaintingTexture } from './regionPlates';
import type { SceneContext, WalkEngine } from './sceneContext';
import type { SceneTravel } from './sceneTravel';
import { START_REGION } from './walkState';

const ACTION_LOCK_MS = 2_200;

interface SceneResources {
  observer: ResizeObserver;
  listening: AbortController;
  unsubscribeCompanions: () => void;
  chalkLayer: ReturnType<typeof createChalkLayer>;
}

export function createWalkControls(
  { container, state, wake, parts }: SceneContext,
  { plan, redirect, switchRegion }: SceneTravel,
  { observer, listening, unsubscribeCompanions, chalkLayer }: SceneResources,
): WalkEngine {
  const {
    markerMats,
    loader,
    loaded,
    releaseTextures,
    outfits,
    character,
    renderer,
    scene,
    camera,
    geo,
    waterMaps,
    background,
    pierFishing,
    companions,
    foregroundMaterial,
    bedRest,
    foregrounds,
    shadowMat,
    portalVisuals,
    fireflies,
    placeEffects,
    nightLights,
    life,
    roamers,
    schoolmates,
    ball,
    waves,
    boats,
    countryside,
    leaves,
    rain,
    targetMat,
    dust,
    jump,
    keys,
    portalInput,
    startPlate,
  } = parts;
  return {
    async setAppearance(next) {
      const request = ++state.appearanceRequest;
      const url = characterLayers(next).outfit;
      try {
        let texture = outfits.get(url);
        if (!texture) {
          texture = preparePaintingTexture(await loader.loadAsync(url));
          if (state.disposed) {
            texture.dispose();
            return false;
          }
          outfits.set(url, texture);
          loaded.push(texture);
        }
        if (state.disposed || request !== state.appearanceRequest) return false;
        state.currentAppearance = next;
        character.setOutfit(texture);
        container.dataset.appearance = `${next.character}-${next.outfit}`;
        if (state.region === REGION.home) void bedRest.prepare(next.character);
        wake();
        return true;
      } catch {
        return false;
      }
    },
    finishSleep() {
      state.sleeping = false;
      bedRest.finish();
      character.setOpacity(1);
      wake();
    },
    setWeather(value) {
      state.weather = value;
      wake();
    },
    setTimeOfDay(value) {
      state.timeOfDay = value;
      wake();
    },
    reactToCompanion(reaction) {
      state.companionAge = 0;
      companions.react(reaction);
      wake();
    },
    greetSchoolmate(id) {
      const friend = schoolmates.greet(id, state.position);
      if (!friend) return false;
      const standing = schoolmateGreetingPosition({ player: state.position, friend, region: state.region });
      if (!standing) {
        schoolmates.endGreeting();
        return false;
      }
      state.position = standing;
      state.greetingId = id;
      state.route = [];
      state.destination = null;
      keys.clear();
      state.moveSpeed = 0;
      state.heading = Math.atan2(friend.x - state.position.x, friend.z - state.position.z);
      wake();
      return true;
    },
    endSchoolmateGreeting() {
      schoolmates.endGreeting();
      state.greetingId = null;
      state.ballFrame = null;
      state.route = [];
      state.moveSpeed = 0;
      wake();
    },
    setBallGame(frame) {
      if (frame && (!state.greetingId || state.region !== REGION.school || state.weather === WEATHER.rain))
        return false;
      if (frame && !state.ballFrame) {
        const friend = schoolmates.standing.find((friend) => friend.id === state.greetingId);
        const spot = friend ? schoolmatePlayPosition({ player: state.position, friend }) : null;
        if (!spot) return false;
        state.route = findRoute(state.position, spot, state.region);
        state.destination = null;
        jump.height = 0;
        jump.velocity = 0;
      }
      if (frame === state.ballFrame) return state.route.length === 0;
      const hasPhaseChanged = frame?.phase !== state.ballFrame?.phase;
      if (frame?.phase === BALL_PHASE.returning && state.ballFrame?.phase !== BALL_PHASE.returning)
        state.companionAge = 0;
      state.ballFrame = frame;
      schoolmates.setBallGame(frame);
      if (hasPhaseChanged) wake();
      if (state.route.length === 0 && state.greetingId) {
        const friend = schoolmates.standing.find((friend) => friend.id === state.greetingId);
        if (friend) state.heading = Math.atan2(friend.x - state.position.x, friend.z - state.position.z);
      }
      return state.route.length === 0;
    },
    setFishing(frame) {
      if (frame && !state.fishingFrame) {
        if (!isNearSpot('pier', state.position, state.region)) return;
        state.route = [];
        state.destination = null;
        keys.clear();
        state.heading = Math.PI / 2;
        state.moveSpeed = 0;
        jump.height = 0;
        jump.velocity = 0;
      }
      if (frame?.phase !== state.fishingFrame?.phase) state.fishingAge = 0;
      state.fishingFrame = frame;
      container.dataset.fishing = frame?.phase ?? 'none';
      wake();
    },
    setPaused(value) {
      state.paused = value;
      keys.clear();
      // A dialog covers the scenery, so a half-played action is dropped rather than frozen under it.
      if (value) placeEffects.clear();
      wake();
    },
    setInput(key, pressed) {
      if (!pressed) portalInput.release(key);
      if (pressed && portalInput.isBlocked(key)) return;
      if (key === 'shift') {
        state.touchSprint = pressed;
        return;
      }
      if (key === ' ') {
        if (pressed && !state.paused) startJump(jump);
        return;
      }
      if (pressed && state.paused) return;
      if (pressed) {
        keys.add(key);
        if (key !== 'shift') {
          state.route = [];
          state.destination = null;
        }
      } else keys.delete(key);
    },
    playAction(kind, at) {
      const now = performance.now();
      if (now < state.actionEndsAt) return false;
      state.actionEndsAt = now + ACTION_LOCK_MS;
      if (!state.reducedMotion) placeEffects.play(kind, at);
      wake();
      return true;
    },
    travelTo(id) {
      state.destination = id;
      redirect(plan());
    },
    reset() {
      state.destination = null;
      switchRegion(START_REGION, SPAWN, startPlate);
      keys.clear();
    },
    photo() {
      renderer.render(scene, camera);
      const canvas = document.createElement('canvas');
      canvas.width = renderer.domElement.width;
      canvas.height = renderer.domElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return Promise.resolve(false);
      ctx.drawImage(renderer.domElement, 0, 0);
      ctx.fillStyle = '#fff9e8';
      ctx.font = `${Math.max(20, canvas.width / 55)}px ${CANVAS_FONT_FAMILY}`;
      ctx.shadowColor = '#18372c';
      ctx.shadowBlur = 5;
      ctx.fillText('여름빛 산책', canvas.width * 0.04, canvas.height * 0.95);
      return new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = `komorebi-${state.region}-${Date.now()}.png`;
          a.href = url;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(true);
        });
      });
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      cancelAnimationFrame(state.animation);
      observer.disconnect();
      listening.abort();
      foregrounds.forEach(({ mesh }) => mesh.geometry.dispose());
      foregroundMaterial.dispose();
      bedRest.dispose();
      pierFishing.dispose();
      companions.dispose();
      unsubscribeCompanions();
      portalVisuals.dispose();
      fireflies.dispose();
      placeEffects.dispose();
      chalkLayer.dispose();
      nightLights.dispose();
      life.dispose();
      roamers.dispose();
      schoolmates.dispose();
      ball.dispose();
      waves.dispose();
      boats.dispose();
      countryside.dispose();
      leaves.dispose();
      waterMaps.dispose();
      rain.dispose();
      geo.dispose();
      dust.dispose();
      [background, shadowMat, targetMat, ...markerMats].forEach((m) => m.dispose());
      releaseTextures();
      character.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
