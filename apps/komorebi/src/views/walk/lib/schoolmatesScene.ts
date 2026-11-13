import * as THREE from 'three';
import { BALL_ROLE, type BallGame } from '../model/ballGame';
import {
  advanceSchoolmate,
  createSchoolmate,
  nearestSchoolmate,
  SCHOOL_REGION,
  SCHOOLMATES,
  schoolRegion,
  type Schoolmate,
  type SchoolmateId,
  type SchoolRegion,
} from '../model/schoolmates';
import { characterLayers } from '../model/world/appearance';
import type { Point, Region } from '../model/world/world';
import { canvasTexture } from './art';
import { createChild, type ChildLayers } from './child';
import { WALK_CYCLE_DISTANCE } from './motion';
import { lampGlowAt } from './nightLights';
import { characterScale, CHILD_SIZE, sceneX, sceneY } from './perspective';
import { preparePaintingTexture } from './regionPlates';

type Standing = Point & { order: number; id: SchoolmateId };
type SchoolmateActor = {
  spec: (typeof SCHOOLMATES)[number];
  character: ReturnType<typeof createChild>;
  textures: ChildLayers;
  shadow: THREE.Sprite;
  state: Schoolmate | null;
};
type Frame = { region: Region; dt: number; darkness: number; isStill: boolean; isRaining: boolean; player: Point };
type SchoolmatesScene = {
  readonly standing: readonly Standing[];
  update: (frame: Frame) => void;
  greet: (id: SchoolmateId, player: Point) => Point | null;
  endGreeting: () => void;
  setBallGame: (frame: BallGame | null) => void;
  dispose: () => void;
};
const CHILD_ORDER = 4;
const DEPTH_ORDER_SCALE = 0.01;
const NIGHT_THRESHOLD = 0.5;
const NPC_STRIDE_DISTANCE = 2.5;

export function createSchoolmates(
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  onNotice: (message: string) => void,
): SchoolmatesScene {
  const actors: SchoolmateActor[] = [];
  const pending = new Set<string>();
  let currentRegion: SchoolRegion | null = null;
  let isDisposed = false;
  let standing: Standing[] = [];
  let shadowTexture: THREE.CanvasTexture | null = null;
  let greetingId: SchoolmateId | null = null;
  let ballFrame: BallGame | null = null;

  function ensureActors() {
    for (const spec of SCHOOLMATES) {
      if (pending.has(spec.id) || actors.some((actor) => actor.spec.id === spec.id)) continue;
      pending.add(spec.id);
      const urls = characterLayers(spec);
      void Promise.allSettled([loader.loadAsync(urls.body), loader.loadAsync(urls.outfit)])
        .then(([body, outfit]) => {
          if (isDisposed || body.status === 'rejected' || outfit.status === 'rejected') {
            for (const layer of [body, outfit]) {
              if (layer.status === 'fulfilled') layer.value.dispose();
            }
            if (!isDisposed) throw new Error('Schoolmate artwork unavailable');
            return;
          }
          const textures = {
            body: preparePaintingTexture(body.value),
            outfit: preparePaintingTexture(outfit.value),
            bodyPoseOffsets: urls.bodyPoseOffsets,
          };
          const character = createChild(textures);
          character.group.visible = false;
          if (!shadowTexture)
            shadowTexture = canvasTexture(64, 32, (ctx) => {
              const gradient = ctx.createRadialGradient(32, 16, 1, 32, 16, 30);
              gradient.addColorStop(0, '#17332b66');
              gradient.addColorStop(1, '#17332b00');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 64, 32);
            });
          const shadow = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: shadowTexture, transparent: true, depthTest: false }),
          );
          shadow.renderOrder = 3;
          shadow.visible = false;
          scene.add(character.group, shadow);
          actors.push({
            spec,
            character,
            textures,
            shadow,
            state: currentRegion ? createSchoolmate(spec, currentRegion) : null,
          });
        })
        .catch(() => {
          if (!isDisposed) onNotice('친구들 모습을 불러오지 못했어요. 학교에 다시 오면 다시 시도할게요.');
        })
        .finally(() => pending.delete(spec.id));
    }
  }

  return {
    get standing(): readonly Standing[] {
      return standing;
    },
    greet(id, player) {
      if (nearestSchoolmate(standing, player) !== id) return null;
      greetingId = id;
      return standing.find((friend) => friend.id === id) ?? null;
    },
    endGreeting() {
      greetingId = null;
      ballFrame = null;
    },
    setBallGame(frame) {
      ballFrame = frame;
    },
    update(frame: Frame): void {
      const region = schoolRegion(frame.region);
      if (region !== currentRegion) {
        greetingId = null;
        ballFrame = null;
        currentRegion = region;
        actors.forEach((actor) => {
          actor.state = region ? createSchoolmate(actor.spec, region) : null;
        });
        if (region) ensureActors();
      }
      standing = [];
      const isVisible =
        region !== null && frame.darkness < NIGHT_THRESHOLD && !(region === SCHOOL_REGION.yard && frame.isRaining);
      actors.forEach((actor) => {
        const { character, shadow, state } = actor;
        character.group.visible = isVisible;
        shadow.visible = isVisible;
        if (!isVisible || !region || !state) return;
        const next = advanceSchoolmate(state, {
          spec: actor.spec,
          region,
          dt: frame.dt,
          isStill: frame.isStill || greetingId === actor.spec.id,
          player: frame.player,
        });
        if (greetingId === actor.spec.id)
          next.heading = Math.atan2(frame.player.x - next.position.x, frame.player.z - next.position.z);
        actor.state = next;
        const size = characterScale(next.position.z) * CHILD_SIZE;
        const order = CHILD_ORDER + (next.position.z - frame.player.z) * DEPTH_ORDER_SCALE;
        character.group.position.set(sceneX(next.position.x), sceneY(next.position.z), 2);
        character.group.scale.setScalar(size);
        character.group.children.forEach((part) => {
          part.renderOrder = order;
        });
        character.update({
          dt: frame.dt,
          travel: next.travel * (WALK_CYCLE_DISTANCE / NPC_STRIDE_DISTANCE),
          heading: next.heading,
          isWalking: next.travel > 0,
          isRunning: false,
          isStill: frame.isStill,
        });
        character.setBallPose({
          game: greetingId === actor.spec.id ? ballFrame : null,
          role: BALL_ROLE.friend,
          heading: next.heading,
          isStill: frame.isStill,
        });
        character.setLight(frame.darkness, lampGlowAt(region, next.position));
        shadow.position.set(character.group.position.x, character.group.position.y - 0.08, 1);
        shadow.scale.set(3.8 * size, 1.1 * size, 1);
        standing.push({ ...next.position, order, id: actor.spec.id });
      });
    },
    dispose(): void {
      isDisposed = true;
      actors.forEach(({ character, textures, shadow }) => {
        scene.remove(character.group, shadow);
        character.dispose();
        textures.body.dispose();
        textures.outfit.dispose();
        shadow.material.dispose();
      });
      shadowTexture?.dispose();
      standing = [];
    },
  };
}
