import type { Peer } from '@komorebi/realtime';
import * as THREE from 'three';
import { CHARACTER, characterLayers } from '../model/world/appearance';
import type { Point, Region } from '../model/world/world';
import { CANVAS_FONT_FAMILY, canvasTexture } from './art';
import { createChild, type ChildLayers } from './child';
import { lampGlowAt } from './nightLights';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from './perspective';
import { preparePaintingTexture } from './regionPlates';

type Actor = {
  peer: Peer;
  character: ReturnType<typeof createChild>;
  textures: ChildLayers;
  label: THREE.Sprite;
  shadow: THREE.Sprite;
  point: Point;
  region: Region;
  jumpHeight: number;
  labelWidth: number;
};
type Frame = { region: Region; dt: number; darkness: number; isStill: boolean; player: Point };
type Standing = Point & { order: number };
type TogetherScene = {
  readonly standing: readonly Standing[];
  setPeers: (peers: readonly Peer[]) => void;
  update: (frame: Frame) => void;
  dispose: () => void;
};
const FOLLOW_SPEED = 18;
const SNAP_DISTANCE = 18;
const CHILD_ORDER = 4;
const DEPTH_ORDER_SCALE = 0.01;

export function createTogetherScene(options: {
  scene: THREE.Scene;
  loader: THREE.TextureLoader;
  onNotice: (message: string) => void;
}): TogetherScene {
  const { scene, loader, onNotice } = options;
  const actors = new Map<string, Actor>();
  const pending = new Set<string>();
  let peers: readonly Peer[] = [];
  let standing: Standing[] = [];
  let isDisposed = false;

  function remove(actor: Actor) {
    scene.remove(actor.character.group, actor.label, actor.shadow);
    actor.character.dispose();
    actor.textures.body.dispose();
    actor.textures.outfit.dispose();
    actor.label.material.map?.dispose();
    actor.label.material.dispose();
    actor.shadow.material.map?.dispose();
    actor.shadow.material.dispose();
  }
  function ensure(peer: Peer) {
    const key = `${peer.id}:${peer.walker.outfit}`;
    if (pending.has(key)) return;
    pending.add(key);
    const urls = characterLayers({ character: CHARACTER.child, outfit: peer.walker.outfit });
    void Promise.allSettled([loader.loadAsync(urls.body), loader.loadAsync(urls.outfit)])
      .then(([body, outfit]) => {
        const current = peers.find((entry) => entry.id === peer.id);
        if (
          isDisposed ||
          !current ||
          current.walker.outfit !== peer.walker.outfit ||
          body.status === 'rejected' ||
          outfit.status === 'rejected'
        ) {
          for (const result of [body, outfit]) if (result.status === 'fulfilled') result.value.dispose();
          if (!isDisposed && current && (body.status === 'rejected' || outfit.status === 'rejected'))
            onNotice('친구의 모습을 불러오지 못했어요. 잠시 후 다시 시도할게요.');
          return;
        }
        const textures: ChildLayers = {
          body: preparePaintingTexture(body.value),
          outfit: preparePaintingTexture(outfit.value),
          bodyPoseOffsets: urls.bodyPoseOffsets,
        };
        const character = createChild(textures);
        const labelWidth = Math.max(112, Array.from(current.nickname).length * 36 + 40);
        const labelTexture = canvasTexture(labelWidth, 72, (ctx) => {
          ctx.fillStyle = '#faf7e9e8';
          ctx.beginPath();
          ctx.roundRect(4, 4, labelWidth - 8, 64, 24);
          ctx.fill();
          ctx.fillStyle = '#344a3b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `600 36px ${CANVAS_FONT_FAMILY}`;
          ctx.fillText(current.nickname, labelWidth / 2, 37, labelWidth - 24);
        });
        const label = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthTest: false }),
        );
        label.renderOrder = 1_100;
        const shadowTexture = canvasTexture(64, 32, (ctx) => {
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
        const previous = actors.get(peer.id);
        if (previous) remove(previous);
        const actor: Actor = {
          peer: current,
          character,
          textures,
          label,
          shadow,
          point: { x: current.walker.x, z: current.walker.z },
          region: current.walker.region,
          jumpHeight: 0,
          labelWidth,
        };
        character.group.visible = false;
        label.visible = false;
        shadow.visible = false;
        actors.set(peer.id, actor);
        scene.add(character.group, label, shadow);
      })
      .catch(() => {
        if (!isDisposed) onNotice('친구의 모습을 준비하지 못했어요.');
      })
      .finally(() => pending.delete(key));
  }
  return {
    get standing() {
      return standing;
    },
    setPeers(next) {
      peers = next;
      for (const [id, actor] of actors) {
        const current = next.find((peer) => peer.id === id);
        if (!current) {
          remove(actor);
          actors.delete(id);
          continue;
        }
        const hasChangedOutfit = actor.peer.walker.outfit !== current.walker.outfit;
        if (hasChangedOutfit) ensure(current);
        else actor.peer = current;
      }
      for (const peer of next) if (!actors.has(peer.id)) ensure(peer);
    },
    update(frame) {
      standing = [];
      for (const actor of actors.values()) {
        const { character, label, shadow } = actor;
        const walker = actor.peer.walker;
        const isVisible = walker.region === frame.region;
        character.group.visible = isVisible;
        label.visible = isVisible;
        shadow.visible = isVisible;
        if (!isVisible) continue;
        const before = { ...actor.point };
        if (
          actor.region !== walker.region ||
          Math.hypot(actor.point.x - walker.x, actor.point.z - walker.z) > SNAP_DISTANCE
        )
          actor.point = { x: walker.x, z: walker.z };
        actor.region = walker.region;
        const blend = 1 - Math.exp(-FOLLOW_SPEED * frame.dt);
        actor.point.x += (walker.x - actor.point.x) * blend;
        actor.point.z += (walker.z - actor.point.z) * blend;
        actor.jumpHeight += (walker.jumpHeight - actor.jumpHeight) * blend;
        const travel = Math.hypot(actor.point.x - before.x, actor.point.z - before.z);
        const size = characterScale(actor.point.z) * CHILD_SIZE;
        const order = CHILD_ORDER + (actor.point.z - frame.player.z) * DEPTH_ORDER_SCALE;
        character.group.position.set(
          sceneX(actor.point.x),
          sceneY(actor.point.z) + actor.jumpHeight * characterScale(actor.point.z),
          2,
        );
        character.group.scale.setScalar(size);
        character.group.children.forEach((part) => {
          part.renderOrder = order;
        });
        character.update({
          dt: frame.dt,
          travel,
          heading: walker.heading,
          isWalking: walker.isWalking && travel > 0.003,
          isRunning: walker.isRunning,
          isStill: frame.isStill,
          jumpHeight: actor.jumpHeight,
        });
        character.setLight(frame.darkness, lampGlowAt(frame.region, actor.point));
        shadow.position.set(character.group.position.x, sceneY(actor.point.z) - 0.08, 1);
        shadow.scale.set(3.8 * size, 1.1 * size, 1);
        label.position.set(character.group.position.x, character.group.position.y + 11.4 * size, 3);
        label.scale.set((actor.labelWidth / 72) * 2.2 * size, 2.2 * size, 1);
        standing.push({ ...actor.point, order });
      }
    },
    dispose() {
      isDisposed = true;
      actors.forEach(remove);
      actors.clear();
      standing = [];
      peers = [];
    },
  };
}
