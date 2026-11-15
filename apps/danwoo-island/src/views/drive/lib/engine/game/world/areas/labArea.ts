import gsap from 'gsap';
import { color, Fn, luminance, mix, positionGeometry, sin, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial';
import { rebuildLabGate } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import { LabScroller } from './labScroller';
import { bindBlackBoardLabels } from './showcaseBlackBoard';
import { ShowcaseImages } from './showcaseImages';
import { hideIntersectMesh, TitleSign, UrlSign } from './showcaseSigns';
import { createHoverMaterials, createShades, swingPendulum } from './showcaseVisuals';

const FEATURED_INDEX = 0;
const CANDLE = { sway: 0.06, speed: 0.3, frequency: 3, growDuration: 10 } as const;
const HERBAL_BREW = { center: '#ffb347', rim: '#c2410c', intensity: 1.2 } as const;
const EMBERS = { colorA: '#ff6b2b', colorB: '#ff4100', intensity: 1.25 } as const;
const HEAT = { from: '#ff3e00', to: '#ff8641', speed: 0.05 } as const;

function assignMaterial(object: THREE.Object3D, material: THREE.Material): void {
  if (object instanceof THREE.Mesh) object.material = material;
}

export class LabArea extends Area {
  constructor(model: THREE.Object3D) {
    super(model);
    const require = (name: string): THREE.Object3D => this.requireReference(name);
    const projects = content.lab;
    const featured = projects[FEATURED_INDEX];
    const sibling = projects[(FEATURED_INDEX + 1) % projects.length];
    const shades = createShades();

    this.#createInteractivePoint();
    const { inactive } = createHoverMaterials(shades);
    const images = new ShowcaseImages({
      mesh: require('images'),
      shades,
      currentKey: () => featured?.image ?? '',
      siblingKey: () => sibling?.image ?? '',
    });
    assignMaterial(require('arrowPrevious'), inactive);
    assignMaterial(require('arrowNext'), inactive);
    const title = new TitleSign(require('title'), shades, () => featured?.title ?? '');
    const url = new UrlSign({ group: require('url'), shades, getUrl: () => featured?.url ?? '' });
    hideIntersectMesh(require('intersectUrl'));
    const scroller = new LabScroller({ require, projects, shades });
    swingPendulum(this.references.items.get('balls') ?? []);
    bindBlackBoardLabels(require);
    this.#lightCandles();
    this.#heatCauldron();

    title.update('next');
    url.update('next');
    images.update('next');
    scroller.showProject(FEATURED_INDEX);
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    rebuildLabGate(this.model);
    super.setObjects();
  }

  #createInteractivePoint(): void {
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: 'Danwoo Lab',
      align: 'right',
      state: 'concealed',
      onInteract: () => window.open(content.labUrl, '_blank', 'noopener,noreferrer'),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #lightCandles(): void {
    const meshes = this.references.items.get('candleFlame') ?? [];
    const { ticker, materials, dayCycles } = this.game;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
    material.outputNode = materials.emissiveOutput('emissiveOrangeRadialGradient');
    material.positionNode = Fn(() => {
      const newPosition = positionGeometry.toVar();
      const wave = sin(ticker.elapsedScaledUniform.mul(CANDLE.speed).add(uv().y.mul(CANDLE.frequency)));
      const strength = uv().y.oneMinus().pow(2).mul(CANDLE.sway);
      newPosition.x.addAssign(wave.mul(strength));
      return newPosition;
    })();
    for (const mesh of meshes) {
      mesh.scale.setScalar(0);
      mesh.visible = false;
      assignMaterial(mesh, material);
    }

    dayCycles.events.on('night', (isInside) => {
      for (const mesh of meshes) {
        if (isInside) {
          mesh.visible = true;
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: CANDLE.growDuration, ease: 'power1.out', overwrite: true });
          continue;
        }
        gsap.to(mesh.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: CANDLE.growDuration,
          ease: 'power1.in',
          overwrite: true,
          onComplete: () => {
            mesh.visible = false;
          },
        });
      }
    });
  }

  #heatCauldron(): void {
    const { ticker, noises, materials } = this.game;
    const heatMaterial = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    heatMaterial.outputNode = Fn(() => {
      const noiseUv = uv().mul(vec2(2, 0.2));
      noiseUv.y.addAssign(ticker.elapsedScaledUniform.mul(HEAT.speed));
      const strength = texture(noises.perlin, noiseUv).r.mul(uv().y.pow(2));
      const emissiveColor = mix(color(HEAT.from), color(HEAT.to), strength.smoothstep(0, 1)).mul(
        strength.add(1).mul(2),
      );
      return vec4(vec3(emissiveColor), strength);
    })();
    const heat = this.requireReference('heat');
    assignMaterial(heat, heatMaterial);
    heat.castShadow = false;

    const palette = materials.get('palette');
    if (!(palette instanceof MeshDefaultMaterial)) throw new Error('Palette material is not a default material');
    const woodMaterial = palette.clone();
    const emberA = uniform(color(EMBERS.colorA));
    const emberB = uniform(color(EMBERS.colorB));
    const emberIntensity = uniform(EMBERS.intensity);
    const paletteOutput = palette.shadedOutput;
    woodMaterial.outputNode = Fn(() => {
      const radius = uv(1).toVar().sub(0.5).length().mul(2);
      const emberColor = mix(emberA, emberB, radius);
      const ember = emberColor.div(luminance(emberColor)).mul(emberIntensity);
      return vec4(mix(paletteOutput.rgb, ember, radius.pow2()).rgb, 1);
    })();
    assignMaterial(this.requireReference('wood'), woodMaterial);

    const brewCenter = uniform(color(HERBAL_BREW.center));
    const brewRim = uniform(color(HERBAL_BREW.rim));
    const brewIntensity = uniform(HERBAL_BREW.intensity);
    const liquidMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true });
    const brew = mix(brewCenter, brewRim, uv().sub(0.5).length().mul(2));
    liquidMaterial.colorNode = brew.div(luminance(brew)).mul(brewIntensity);
    liquidMaterial.fog = false;
    assignMaterial(this.requireReference('liquid'), liquidMaterial);
  }
}
