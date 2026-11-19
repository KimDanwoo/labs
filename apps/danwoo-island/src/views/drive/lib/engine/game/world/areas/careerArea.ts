import gsap from 'gsap';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import { type AudioItem, moveSoundTo } from '../../audioItem';
import { clamp } from '../../utilities/maths';
import { tieCareerRopes } from '../careerRopes';
import { paintCareerLines } from '../islandReskins';
import { Area } from './area';
import {
  ACTIVE_ELEVATION,
  type CareerLine,
  EASING,
  LINE_AXIS,
  PADDING,
  RAISED_THRESHOLD,
  RESUME_ELEVATION,
  SINK_DELAY,
  isLineColor,
  labelMaterial,
  profileTexture,
  worldToLocalMatrix,
} from './careerArt';

export class CareerArea extends Area {
  readonly #lines: CareerLine[];
  readonly #stoneOut: AudioItem;
  readonly #stoneIn: AudioItem;
  readonly #playerLocal = new THREE.Vector3();

  constructor(model: THREE.Object3D) {
    super(model);
    const { audio } = this.game;
    this.#stoneOut = audio.register({
      path: 'sounds/stoneSlides/stoneSlideOut.mp3',
      autoplay: false,
      loop: false,
      volume: 0.3,
      antiSpam: 0.1,
      positions: new THREE.Vector3(),
      distanceFade: 14,
      onPlay: (item, origin, index) => {
        moveSoundTo(item, origin);
        if (typeof index === 'number') item.rate = 1.2 + index * 0.1;
      },
    });
    this.#stoneIn = audio.register({
      path: 'sounds/stoneSlides/stoneSlideIn.mp3',
      autoplay: false,
      loop: false,
      volume: 0.2,
      rate: 0.8,
      antiSpam: 0.1,
      positions: new THREE.Vector3(),
      distanceFade: 14,
      onPlay: (item, origin) => moveSoundTo(item, origin),
    });
    this.#lines = this.#createLines();
    const year = this.requireReference('year');
    year.removeFromParent();
    this.#createResumeLink(year.position);
  }

  override setObjects(): void {
    paintCareerLines(this.model);
    tieCareerRopes(this.model);
    super.setObjects();
  }

  #createLines(): CareerLine[] {
    const lines = (this.references.items.get('line') ?? []).map((group) => this.#createLine(group));
    const along = LINE_AXIS.clone().applyQuaternion(this.model.quaternion);
    lines.sort((a, b) => b.origin.dot(along) - a.origin.dot(along));
    return lines.map((line, index) => ({ ...line, index }));
  }

  #createLine(group: THREE.Object3D): CareerLine {
    const { userData } = group;
    const stone = group.children.find((child) => child.name.startsWith('stone'));
    if (!stone) throw new Error('Career line has no stone');
    stone.position.y = 0;
    const labelReveal = uniform(0);
    const textMesh = stone.children.find((child) => child.name.startsWith('careerText'));
    const lineColor: unknown = userData.color;
    if (textMesh instanceof THREE.Mesh && isLineColor(lineColor)) {
      textMesh.castShadow = false;
      textMesh.receiveShadow = false;
      textMesh.material = labelMaterial(profileTexture(userData.texture), lineColor, labelReveal);
    }
    return {
      index: 0,
      size: Number.parseFloat(String(userData.size)),
      hasEnd: Boolean(userData.hasEnd),
      stone,
      origin: group.position.clone(),
      toLocal: worldToLocalMatrix(group),
      labelReveal,
      isIn: false,
      isUp: false,
      offsetTarget: 0,
    };
  }

  #createResumeLink(yearPosition: THREE.Vector3): void {
    const position = yearPosition.clone();
    position.y = RESUME_ELEVATION;
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position,
      text: '이력서 보기',
      align: 'right',
      state: 'concealed',
      onInteract: () => window.open(content.resumeUrl, '_blank', 'noopener,noreferrer'),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #sink(line: CareerLine): void {
    if (!line.isUp) return;
    line.isUp = false;
    gsap.delayedCall(SINK_DELAY, () => this.#stoneIn.play(line.origin));
  }

  #updateLine(line: CareerLine): void {
    const { player, ticker } = this.game;
    const delta = -this.#playerLocal.copy(player.position).applyMatrix4(line.toLocal).z;
    const isInside = delta > -PADDING && delta < line.size + PADDING * 2;
    if (isInside !== line.isIn) {
      line.isIn = isInside;
      const reveal = isInside
        ? { value: 1, duration: 1, delay: 0.3, overwrite: true, ease: 'power2.inOut' }
        : { value: 0, duration: 1, overwrite: true, ease: 'power2.inOut' };
      gsap.to(line.labelReveal, reveal);
    }

    if (line.isIn && !line.isUp) {
      line.isUp = true;
      this.#stoneOut.play(line.origin, line.index);
    } else if (!line.isIn && (delta <= line.size || line.hasEnd)) {
      this.#sink(line);
    }

    const elevationTarget = line.isUp ? ACTIVE_ELEVATION : 0;
    line.stone.position.y += (elevationTarget - line.stone.position.y) * ticker.deltaScaled * EASING.elevation;

    if (!line.isIn) line.offsetTarget = delta > line.size ? -line.size : 0;
    else if (line.stone.position.y > RAISED_THRESHOLD) line.offsetTarget = -clamp(delta, 0, line.size);
    line.stone.position.z += (line.offsetTarget - line.stone.position.z) * ticker.deltaScaled * EASING.offset;
  }

  override update(): void {
    for (const line of this.#lines) this.#updateLine(line);
  }
}
