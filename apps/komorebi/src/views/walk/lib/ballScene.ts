import * as THREE from 'three';
import { BALL_PHASE, type BallGame } from '../model/ballGame';
import { ballFlight } from '../model/ballMotion';
import type { Point } from '../model/world/world';
import { canvasTexture } from './art';
import { characterScale, CHILD_SIZE, sceneX, sceneY } from './perspective';

type BallScene = {
  update: (frame: { game: BallGame | null; player: Point; friend: Point | null; isStill: boolean }) => void;
  dispose: () => void;
};
export function createBallScene(scene: THREE.Scene): BallScene {
  const texture = canvasTexture(64, 64, (ctx) => {
    const light = ctx.createRadialGradient(22, 18, 2, 32, 32, 28);
    light.addColorStop(0, '#fffce5');
    light.addColorStop(1, '#b8b7a0');
    ctx.fillStyle = light;
    ctx.strokeStyle = '#4a5d62';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.bezierCurveTo(8, 18, 12, 48, 32, 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 32);
    ctx.bezierCurveTo(23, 17, 43, 22, 60, 32);
    ctx.stroke();
  });
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.visible = false;
  sprite.renderOrder = 4.5;
  const shadowTexture = canvasTexture(64, 32, (ctx) => {
    const shade = ctx.createRadialGradient(32, 16, 1, 32, 16, 30);
    shade.addColorStop(0, '#344a3b70');
    shade.addColorStop(1, '#344a3b00');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 64, 32);
  });
  const shadowMaterial = new THREE.SpriteMaterial({
    map: shadowTexture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const shadow = new THREE.Sprite(shadowMaterial);
  shadow.visible = false;
  shadow.renderOrder = 3.2;
  scene.add(sprite, shadow);
  return {
    update({ game, player, friend, isStill }) {
      sprite.visible = !!game && !!friend && game.phase !== BALL_PHASE.complete;
      shadow.visible = sprite.visible;
      if (!game || !friend) return;
      const motion = ballFlight({ game, isStill });
      const t = motion.progress;
      const x = THREE.MathUtils.lerp(friend.x, player.x, t);
      const z = THREE.MathUtils.lerp(friend.z, player.z, t);
      const size = characterScale(z) * CHILD_SIZE;
      const towardPlayer = Math.sign(player.x - friend.x);
      const handOffset = THREE.MathUtils.lerp(towardPlayer, -towardPlayer, Math.min(1, t)) * size;
      const height = Math.max(size * 0.7, size * 3.8 + motion.arc);
      sprite.position.set(sceneX(x) + handOffset, sceneY(z) + height, 2);
      sprite.scale.setScalar(size * 1.9);
      material.rotation = motion.spin * towardPlayer;
      shadow.position.set(sprite.position.x, sceneY(z) + 0.05, 1);
      shadow.scale.set(size * 2.3, size * 0.7, 1);
      shadowMaterial.opacity = Math.max(0.18, 0.65 - height * 0.06);
    },
    dispose() {
      scene.remove(sprite, shadow);
      material.dispose();
      texture.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
    },
  };
}
