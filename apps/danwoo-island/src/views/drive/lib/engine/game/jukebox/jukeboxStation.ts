import gsap from 'gsap';
import {
  color,
  Fn,
  instancedBufferAttribute,
  instanceIndex,
  sin,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../data/danwoo';
import { nowPlayingNotice } from '../audio';
import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { JukeboxPanel } from './jukeboxPanel';
import { JukeboxPlayer } from './jukeboxPlayer';

const NOTES = { count: 8, spread: 1, speed: 0.2, size: 1.5, offset: new THREE.Vector3(0, 1, 0.5) } as const;
const NOTES_COLOR = '#ff994d';
const NOTES_STRENGTH = 3.5;
const FADE_DURATION = 0.6;
const NOTICE_DURATION = 5;
const PALETTE_SLOTS = 32;
const ARCH_SLOTS = [3, 10, 18] as const;
const GLOW = { strength: 1.4, speed: 3.2 } as const;
const MODEL_NAME = 'jukebox';

export class JukeboxStation {
  readonly player: JukeboxPlayer;
  readonly #panel: JukeboxPanel;
  readonly #presence = uniform(0);

  constructor({ anchor, pointPosition }: { anchor: THREE.Object3D; pointPosition: THREE.Vector3 }) {
    const { audio, notifications, modals } = getGame();
    const modal = modals.items.get('jukebox');
    if (!modal) throw new Error('Jukebox modal is missing');
    this.player = new JukeboxPlayer({
      tracks: content.tracks,
      music: audio,
      announce: (title) => notifications.show(nowPlayingNotice(title), { type: 'song', duration: NOTICE_DURATION }),
    });
    this.#panel = new JukeboxPanel({ element: modal.element, player: this.player });
    anchor.add(this.#createNotes());
    this.#applyGlow(anchor);
    this.#createPoint(pointPosition);
    this.player.events.on('change', ({ status }) => this.#fadePresence(status === 'playing'));
  }

  get presence(): THREE.UniformNode<'float', number> {
    return this.#presence;
  }

  #createPoint(position: THREE.Vector3): void {
    const { interactivePoints, inputs, modals } = getGame();
    const { interactiveButtons } = inputs;
    interactivePoints.create({
      position,
      text: '쥬크박스',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        void this.player.prepare();
        modals.open('jukebox');
      },
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #applyGlow(anchor: THREE.Object3D): void {
    const mesh = anchor.getObjectByName(MODEL_NAME);
    if (!(mesh instanceof THREE.Mesh)) return;
    const game = getGame();
    const time = game.ticker.elapsedScaledUniform;
    const colorNode = Fn(() => {
      const slot = uv().x.mul(PALETTE_SLOTS).floor();
      const arch = ARCH_SLOTS.map((index) => step(slot.sub(index).abs(), 0.5)).reduce((sum, mask) => sum.add(mask));
      const pulse = sin(time.mul(GLOW.speed)).mul(0.5).add(0.5).mul(this.#presence).mul(GLOW.strength);
      return texture(game.texture('paletteTexture'), uv()).rgb.mul(arch.mul(pulse).add(1));
    })();
    mesh.material = new MeshDefaultMaterial({ colorNode });
  }

  #fadePresence(isPlaying: boolean): void {
    gsap.to(this.#presence, { value: isPlaying ? 1 : 0, duration: FADE_DURATION, overwrite: true });
  }

  #createNotes(): THREE.Sprite {
    const positions = new Float32Array(NOTES.count * 3);
    for (let index = 0; index < positions.length; index += 1) positions[index] = (Math.random() - 0.5) * NOTES.spread;
    const positionAttribute = new THREE.InstancedBufferAttribute(positions, 3);

    const game = getGame();
    const time = game.ticker.elapsedScaledUniform;
    const notes = game.texture('jukeboxMusicNotes');
    const progress = time.mul(NOTES.speed).add(instanceIndex.toFloat().div(NOTES.count)).fract().toVarying();

    const material = new THREE.PointsNodeMaterial({ size: NOTES.size, sizeAttenuation: true, alphaToCoverage: true });
    material.outputNode = Fn(() => {
      const noteMask = texture(notes, vec2(uv().x, uv().y.oneMinus())).r;
      return vec4(color(NOTES_COLOR).mul(NOTES_STRENGTH), noteMask);
    })();
    material.positionNode = Fn(() => {
      const position = instancedBufferAttribute<'vec3'>(positionAttribute, 'vec3').toVar();
      position.z.addAssign(progress.oneMinus().pow(3).oneMinus());
      position.y.addAssign(progress);
      return position;
    })();
    material.rotationNode = Fn(() => sin(time.mul(4).add(instanceIndex.toFloat())).add(1).mul(0.5).pow(2).oneMinus())();
    material.scaleNode = Fn(() => progress.sub(0.5).abs().mul(2).oneMinus().mul(3).min(1).mul(this.#presence))();

    const sprite = new THREE.Sprite(material);
    sprite.count = NOTES.count;
    sprite.position.copy(NOTES.offset);
    return sprite;
  }
}
