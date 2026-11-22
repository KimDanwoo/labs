import * as THREE from 'three/webgpu';

import { type AudioItem } from '@views/drive/lib/engine/game/audioItem';
import type { InteractivePoint } from '@views/drive/lib/engine/game/interactivePoint';
import { JukeboxStation } from '@views/drive/lib/engine/game/jukebox/jukeboxStation';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import {
  beachGoalSignTexture,
  createScoreboard,
  type Scoreboard,
} from '@views/drive/lib/engine/game/world/areas/beachGoalBoards';
import {
  type Ball,
  GOAL_CONFETTI_OFFSETS,
  GOAL_PAUSE,
  KICKOFF_SPREAD,
  resetBody,
  SCOREBOARD_X,
  SLEEP_DELAY_FRAMES,
} from '@views/drive/lib/engine/game/world/areas/beachGoalConfig';
import { addBeachGoalPitch } from '@views/drive/lib/engine/game/world/areas/beachGoalPitch';
import { isBallInGoal, isBallOffPitch } from '@views/drive/lib/engine/game/world/areas/beachGoalRules';
import {
  createBall,
  createRestartPoint,
  registerBeachGoalSounds,
} from '@views/drive/lib/engine/game/world/areas/beachGoalSetup';
import { rebuildTikiScoreboard } from '@views/drive/lib/engine/game/world/islandReskins';
import {
  rebuildBeachGoalSign,
  rebuildJukebox,
  removeLaneMarks,
} from '@views/drive/lib/engine/game/world/islandStructures';
import { rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';
import { findChild } from '@views/drive/lib/engine/game/world/structureKit';

const BALL_NODE = 'refBallPhysicalDynamic';
const SCREEN_NODE = 'refScreenPhysicalKinematicPositionBased';
const OLD_LANE_NODES = [
  'refPinPhysicalDynamic',
  'refPinPositions',
  'refBumpersPhysicalKinematicPositionBased',
  'refBumpersInteractivePoint001',
  'Cube183',
] as const;
const OLD_LANE_COLLIDER = { parent: 'physicalFixed007', child: 'cuboid113' } as const;

function clearLane(model: THREE.Object3D): void {
  for (const name of OLD_LANE_NODES) findChild(model, name).removeFromParent();
  findChild(findChild(model, OLD_LANE_COLLIDER.parent), OLD_LANE_COLLIDER.child).removeFromParent();
}

export class BeachGoalArea extends Area {
  readonly #sounds: { goal: AudioItem; bump: AudioItem };
  readonly #ball: Ball;
  readonly #scoreboard: Scoreboard;
  readonly #restartPoint: InteractivePoint;
  readonly #local = new THREE.Vector3();
  readonly #toLocal: THREE.Quaternion;
  readonly jukebox: JukeboxStation;
  #goals = 0;
  #returnAt: number | null = null;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#toLocal = model.quaternion.clone().invert();
    this.#sounds = registerBeachGoalSounds(this);
    this.#ball = createBall(this, this.#sounds.bump);
    this.#scoreboard = createScoreboard(this);
    this.#restartPoint = createRestartPoint(this, () => this.restart());
    this.jukebox = new JukeboxStation({
      anchor: this.requireReference('jukebox'),
      pointPosition: this.requireReference('jukeboxInteractivePoint').position,
    });
  }

  override setObjects(): void {
    clearLane(this.model);
    findChild(this.model, BALL_NODE).userData.preventAutoAdd = true;
    findChild(this.model, SCREEN_NODE).position.x = SCOREBOARD_X;
    rebuildVillageProps(this.model);
    rebuildBeachGoalSign(this.model, beachGoalSignTexture());
    removeLaneMarks(this.model);
    rebuildJukebox(this.model);
    rebuildTikiScoreboard(this.model);
    addBeachGoalPitch(this.model);
    super.setObjects();
  }

  #returnBall(): void {
    this.#returnAt = null;
    const sideways = (Math.random() * 2 - 1) * KICKOFF_SPREAD;
    const spot = this.#local.set(0, 0, sideways).applyQuaternion(this.model.quaternion).add(this.#ball.kickoff);
    resetBody(this.#ball.body, spot);
    this.#ball.object.needsUpdate = true;
    this.game.ticker.wait(SLEEP_DELAY_FRAMES, () => this.#ball.body.sleep());
  }

  restart(): void {
    this.#goals = 0;
    this.#scoreboard.write(this.#goals);
    this.#returnBall();
    this.game.ticker.wait(1, () => this.#restartPoint.hide());
    this.game.audio.groups.get('click')?.play(true);
  }

  #celebrateGoal(): void {
    const { ticker, world, player } = this.game;
    this.#goals += 1;
    this.#scoreboard.write(this.#goals);
    this.#returnAt = ticker.elapsed + GOAL_PAUSE;
    this.#sounds.goal.play();
    const { confetti } = world;
    if (!confetti) return;
    confetti.pop(player.position.clone());
    for (const offset of GOAL_CONFETTI_OFFSETS) {
      const local = new THREE.Vector3(...offset).applyQuaternion(this.model.quaternion);
      confetti.pop(this.#scoreboard.group.position.clone().add(local));
    }
  }

  #ballLocalPosition(): THREE.Vector3 {
    return this.#local.copy(this.#ball.body.translation()).sub(this.model.position).applyQuaternion(this.#toLocal);
  }

  #updateBall(): void {
    const ball = this.#ball;
    const isSleeping = ball.body.isSleeping();
    const hasWoken = isSleeping !== ball.isSleeping && !isSleeping;
    ball.isSleeping = isSleeping;
    const shouldOfferRestart = hasWoken && this.#restartPoint.state === 'hidden';
    if (shouldOfferRestart) this.#restartPoint.show();
    if (isSleeping) return;
    const local = this.#ballLocalPosition();
    if (isBallInGoal(local, ball.radius)) this.#celebrateGoal();
    else if (isBallOffPitch(local)) this.#returnBall();
  }

  override update(): void {
    if (this.#returnAt === null) {
      this.#updateBall();
      return;
    }
    if (this.game.ticker.elapsed >= this.#returnAt) this.#returnBall();
  }
}
