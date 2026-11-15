import * as THREE from 'three/webgpu';

import { requireElement } from '../../utilities/requireElement';
import { rebuildBuildingSite } from '../islandStructures';
import { Area } from './area';
import { BlogBoard } from './blogBoard';

const BOARD_POSITION = new THREE.Vector3(50.4, 0, -17.4);
const BOARD_ROTATION = 0.5;
const BOARD_POINT_OFFSET = new THREE.Vector3(0, 1.5, 1.6);
const UP = new THREE.Vector3(0, 1, 0);

export class BehindTheSceneArea extends Area {
  readonly #board: BlogBoard;

  constructor(model: THREE.Object3D) {
    super(model);
    this.game.audio.register({
      path: 'sounds/magic/Environmental Loop Scifi Bright Glassy Wandering Tones Layered 02.mp3',
      autoplay: true,
      loop: true,
      volume: 0.15,
      positions: this.requireReference('interactivePoint').position,
      distanceFade: 20,
    });

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

  override update(): void {
    const { physicalVehicle, ticker } = this.game;
    const { position } = physicalVehicle;
    this.#board.update({ delta: ticker.deltaScaled, viewer: position });
  }
}
