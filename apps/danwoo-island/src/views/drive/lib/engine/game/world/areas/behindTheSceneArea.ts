import { attribute, color, float, Fn, positionGeometry, sin, TWO_PI, uniform, varying, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { PortalSlabsGeometry } from '../../geometries/portalSlabsGeometry';
import { requireElement } from '../../utilities/requireElement';
import { rebuildBuildingSite } from '../islandStructures';
import { Area } from './area';
import { BlogBoard } from './blogBoard';

const SLAB_SIZE = 1.5;
const SLAB_COLUMNS = 6;
const SLAB_ELEVATION = 0.01;
const BOARD_POSITION = new THREE.Vector3(50.4, 0, -17.4);
const BOARD_ROTATION = 0.5;
const BOARD_POINT_OFFSET = new THREE.Vector3(0, 1.5, 1.6);
const UP = new THREE.Vector3(0, 1, 0);

export class BehindTheSceneArea extends Area {
  readonly #vehicleRelativePosition = uniform(vec2());
  readonly #slabs: THREE.Mesh;
  readonly #board: BlogBoard;

  constructor(model: THREE.Object3D) {
    super(model);
    const center = this.requireReference('center').position;
    this.game.audio.register({
      path: 'sounds/magic/Environmental Loop Scifi Bright Glassy Wandering Tones Layered 02.mp3',
      autoplay: true,
      loop: true,
      volume: 0.15,
      positions: this.requireReference('interactivePoint').position,
      distanceFade: 20,
    });

    this.#slabs = new THREE.Mesh(new PortalSlabsGeometry(SLAB_SIZE, SLAB_COLUMNS), this.#slabMaterial());
    this.#slabs.position.copy(center);
    this.#slabs.position.y += SLAB_ELEVATION;
    this.game.scene.add(this.#slabs);
    this.objects.hideable.push(this.#slabs);
    this.#board = this.#createBlogBoard();
  }

  #createBlogBoard(): BlogBoard {
    const { modals, interactivePoints, inputs, scene } = this.game;
    const modal = modals.items.get('blog');
    if (!modal) throw new Error('Blog modal is missing');
    const board = new BlogBoard({
      position: BOARD_POSITION,
      rotation: BOARD_ROTATION,
      listElement: requireElement(modal.element, '.js-blog-posts', HTMLElement),
    });
    scene.add(board.group);
    this.objects.hideable.push(board.group);
    void board.load();

    const { interactiveButtons } = inputs;
    interactivePoints.create({
      position: BOARD_POSITION.clone().add(BOARD_POINT_OFFSET.clone().applyAxisAngle(UP, BOARD_ROTATION)),
      text: '최신 글 보기',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        if (!board.isReady) void board.load();
        modals.open('blog');
      },
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
    return board;
  }

  override setObjects(): void {
    rebuildBuildingSite(this.model);
    super.setObjects();
  }

  #slabMaterial(): THREE.MeshBasicNodeMaterial {
    const { ticker } = this.game;
    const effectVarying = varying(float());
    const chalkColor = uniform(color('#f3ead7'));
    const chalkIntensity = uniform(1);
    const material = new THREE.MeshBasicNodeMaterial({ wireframe: false });

    material.positionNode = Fn(() => {
      const random = attribute('random', 'float');
      const edge = attribute('edge', 'float');
      const center = attribute('center', 'vec2');
      const distanceToCenter = attribute('distanceToCenter', 'float');
      const newPosition = positionGeometry.toVar();
      const oscillation = sin(ticker.elapsedScaledUniform.mul(0.5).add(random.mul(TWO_PI))).mul(0.5);
      const distanceToVehicle = center.sub(this.#vehicleRelativePosition).length();

      const effect = distanceToCenter.remap(0, 3.5, 3, 0).toVar();
      effect.addAssign(oscillation);
      effect.assign(effect.clamp(0, 1));
      effect.addAssign(distanceToVehicle.remapClamp(2, 4, -1, 0));
      effectVarying.assign(effect);
      effect.mulAssign(edge);

      const toCenter = newPosition.xz.sub(center);
      toCenter.mulAssign(effect);
      newPosition.xz.subAssign(toCenter);
      return newPosition;
    })();

    material.outputNode = Fn(() => {
      const edge = attribute('edge', 'float');
      const edgeOffset = effectVarying.remapClamp(0.1, 1, 0.5, 0);
      const edgeThreshold = edge.remapClamp(0, 1, 0.98, 1);
      const strength = edge.toVar().sub(0.5).abs().mul(2).add(edgeOffset).step(edgeThreshold);
      strength.lessThan(0.5).discard();
      return vec4(chalkColor.mul(chalkIntensity), 1);
    })();
    return material;
  }

  override update(): void {
    const { physicalVehicle, ticker } = this.game;
    const { position } = physicalVehicle;
    this.#vehicleRelativePosition.value.set(position.x - this.#slabs.position.x, position.z - this.#slabs.position.z);
    this.#board.update({ delta: ticker.deltaScaled, viewer: position });
  }
}
