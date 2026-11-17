import { getGame } from '../gameContext';
import { type Areas, createAreas } from './areas/areas';
import type { Benches } from './benches';
import type { Bricks } from './bricks';
import type { Bushes } from './bushes';
import { CircuitTrack } from './circuitTrack';
import { Confetti } from './confetti';
import type { ExplosiveCrates } from './explosiveCrates';
import type { Fences } from './fences';
import { Fireballs } from './fireballs';
import { Floor } from './floor';
import type { Flowers } from './flowers';
import { Grass } from './grass';
import { Grid } from './grid';
import { Intro } from './intro';
import { placeIslandBridges } from './islandBridges';
import type { IslandTrees } from './islandTrees';
import type { Lanterns } from './lanterns';
import { Lightnings } from './lightnings';
import type { PoleLights } from './poleLights';
import { RainLines } from './rainLines';
import type { Scenery } from './scenery';
import { pruneShadowCasters } from './shadowCasters';
import { VisualVehicle } from './visualVehicle';
import { WaterSurface } from './waterSurface';
import { WindLines } from './windLines';

export class World {
  readonly grid = new Grid();
  intro: Intro | null = new Intro();

  visualVehicle: VisualVehicle | null = null;
  floor: Floor | null = null;
  waterSurface: WaterSurface | null = null;
  grass: Grass | null = null;
  windLines: WindLines | null = null;
  confetti: Confetti | null = null;
  rain: RainLines | null = null;
  lightnings: Lightnings | null = null;
  fireballs: Fireballs | null = null;
  bushes: Bushes | null = null;
  islandTrees: IslandTrees | null = null;
  flowers: Flowers | null = null;
  bricks: Bricks | null = null;
  fences: Fences | null = null;
  benches: Benches | null = null;
  explosiveCrates: ExplosiveCrates | null = null;
  poleLights: PoleLights | null = null;
  lanterns: Lanterns | null = null;
  scenery: Scenery | null = null;
  circuitTrack: CircuitTrack | null = null;
  areas: Areas | null = null;

  populate(): void {
    this.visualVehicle = new VisualVehicle(getGame().model('vehicle').scene);
    this.floor = new Floor();
    this.waterSurface = new WaterSurface();
    this.grass = new Grass();
    this.windLines = new WindLines();
    this.confetti = new Confetti();
    this.rain = new RainLines();
    this.lightnings = new Lightnings();
    this.fireballs = new Fireballs();
    placeIslandBridges();
    this.circuitTrack = new CircuitTrack();
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
    const { bowling, cookie, social } = this.areas ?? {};
    this.explosiveCrates?.reset();
    bowling?.restart();
    cookie?.refreshAfterReset();
    social?.refreshAfterReset();
    for (const decoration of [this.benches, this.fences, this.bricks, this.lanterns]) {
      if (decoration) decoration.instancedGroup.needsUpdate = true;
    }
  }
}
