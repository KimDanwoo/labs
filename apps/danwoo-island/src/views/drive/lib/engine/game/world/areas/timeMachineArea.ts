import gsap from 'gsap';
import { Fn, texture, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '@views/drive/lib/engine/data/danwoo';
import { objectOf } from '@views/drive/lib/engine/game/objectColliders';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';

const HUB_SCREEN = 'areas/island/tvHub.webp';
const COLLIDE_COOLDOWN = 1;
const STRIPE_SPEED = 0.1;

export class TimeMachineArea extends Area {
  constructor(model: THREE.Object3D) {
    super(model);
    this.#createInteractivePoint();
    this.#createTV();
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    super.setObjects();
  }

  #createInteractivePoint(): void {
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: 'Danwoo Lab 가기',
      align: 'right',
      state: 'concealed',
      onInteract: () => window.open(content.labUrl, '_blank', 'noopener,noreferrer'),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #createTV(): void {
    const { audio, noises, ticker } = this.game;
    const hubTexture = new THREE.TextureLoader().load(HUB_SCREEN);
    hubTexture.colorSpace = THREE.SRGBColorSpace;
    hubTexture.flipY = false;
    const screens = [hubTexture];
    const alert = audio.register({
      path: 'sounds/tv/alert.mp3',
      autoplay: false,
      loop: false,
      volume: 0.3,
      preload: true,
    });

    let canCollide = true;
    let collideIndex = 0;
    const screenOutput = (): THREE.Node<'vec4'> =>
      Fn(() => {
        const baseUv = vec2(uv().x, uv().y);
        const screen = screens[collideIndex % screens.length] ?? hubTexture;
        const textureColor = texture(screen, baseUv);
        const stripes = texture(
          noises.perlin,
          vec2(baseUv.y.add(ticker.elapsedScaledUniform.mul(STRIPE_SPEED)), 0),
        ).r.smoothstep(0, 1);
        const stripeBoost = collideIndex % screens.length === 0 ? 1 : 3;
        return vec4(textureColor.rgb.mul(stripes.mul(stripeBoost).add(1)), 1);
      })();

    const material = new THREE.MeshBasicNodeMaterial();
    material.outputNode = screenOutput();
    const screenMesh = this.requireReference('screen');
    if (screenMesh instanceof THREE.Mesh) screenMesh.material = material;

    const tv = objectOf(this.requireReference('tv')).physical;
    if (!tv) throw new Error('TV has no physical body');
    tv.onCollision = () => {
      if (!canCollide) return;
      canCollide = false;
      collideIndex += 1;
      material.outputNode = screenOutput();
      material.needsUpdate = true;
      audio.groups.get('click')?.play(true);
      if (collideIndex === 1) alert.play();
      gsap.delayedCall(COLLIDE_COOLDOWN, () => {
        canCollide = true;
      });
    };
  }
}
