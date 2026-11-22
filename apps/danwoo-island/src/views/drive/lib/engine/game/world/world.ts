import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { type Areas, createAreas } from '@views/drive/lib/engine/game/world/areas/areas';
import { Bushes } from '@views/drive/lib/engine/game/world/bushes';
import { buildCircuitJumps } from '@views/drive/lib/engine/game/world/circuitJumps';
import { CircuitTrack } from '@views/drive/lib/engine/game/world/circuitTrack';
import { Confetti } from '@views/drive/lib/engine/game/world/confetti';
import { ExplosiveCrates } from '@views/drive/lib/engine/game/world/explosiveCrates';
import { Fireballs } from '@views/drive/lib/engine/game/world/fireballs';
import { Floor } from '@views/drive/lib/engine/game/world/floor';
import { Flowers } from '@views/drive/lib/engine/game/world/flowers';
import { Grass } from '@views/drive/lib/engine/game/world/grass';
import { Grid } from '@views/drive/lib/engine/game/world/grid';
import { Intro } from '@views/drive/lib/engine/game/world/intro';
import { placeIslandBridges } from '@views/drive/lib/engine/game/world/islandBridges';
import type { IslandTrees } from '@views/drive/lib/engine/game/world/islandTrees';
import { Lanterns } from '@views/drive/lib/engine/game/world/lanterns';
import { Lightnings } from '@views/drive/lib/engine/game/world/lightnings';
import { PoleLights } from '@views/drive/lib/engine/game/world/poleLights';
import { RainLines } from '@views/drive/lib/engine/game/world/rainLines';
import {
  placeShoreRocks,
  plantScatteredTrees,
  replantScatteredModels,
} from '@views/drive/lib/engine/game/world/scatterPlanting';
import { pruneShadowCasters } from '@views/drive/lib/engine/game/world/shadowCasters';
import { VisualVehicle } from '@views/drive/lib/engine/game/world/visualVehicle';
import { WaterSurface } from '@views/drive/lib/engine/game/world/waterSurface';
import { WindPetals } from '@views/drive/lib/engine/game/world/windPetals';

export class World {
  readonly grid = new Grid();
  intro: Intro | null = new Intro();

  visualVehicle: VisualVehicle | null = null;
  floor: Floor | null = null;
  waterSurface: WaterSurface | null = null;
  grass: Grass | null = null;
  windPetals: WindPetals | null = null;
  confetti: Confetti | null = null;
  rain: RainLines | null = null;
  lightnings: Lightnings | null = null;
  fireballs: Fireballs | null = null;
  bushes: Bushes | null = null;
  islandTrees: IslandTrees | null = null;
  flowers: Flowers | null = null;
  explosiveCrates: ExplosiveCrates | null = null;
  poleLights: PoleLights | null = null;
  lanterns: Lanterns | null = null;
  circuitTrack: CircuitTrack | null = null;
  areas: Areas | null = null;

  populate(): void {
    this.visualVehicle = new VisualVehicle(getGame().model('vehicle').scene);
    this.floor = new Floor();
    this.waterSurface = new WaterSurface();
    this.grass = new Grass();
    this.windPetals = new WindPetals();
    this.confetti = new Confetti();
    this.rain = new RainLines();
    this.lightnings = new Lightnings();
    this.fireballs = new Fireballs();
    replantScatteredModels();
    this.bushes = new Bushes();
    this.islandTrees = plantScatteredTrees();
    this.flowers = new Flowers();
    this.explosiveCrates = new ExplosiveCrates();
    this.poleLights = new PoleLights();
    this.lanterns = new Lanterns();
    placeShoreRocks();
    placeIslandBridges();
    this.circuitTrack = new CircuitTrack();
    buildCircuitJumps();
    this.areas = createAreas();
    pruneShadowCasters(getGame().scene);
  }

  updateLoadingProgress(ratio: number): void {
    this.intro?.updateProgress(ratio);
  }

  finishIntro(): void {
    this.grid.destroy();
    this.intro?.destroy();
    this.intro = null;
  }

  refreshAfterReset(): void {
    const { beachGoal, cookie, social } = this.areas ?? {};
    this.explosiveCrates?.reset();
    beachGoal?.restart();
    cookie?.refreshAfterReset();
    social?.refreshAfterReset();
    if (this.lanterns) this.lanterns.instancedGroup.needsUpdate = true;
  }
}
