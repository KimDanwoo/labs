import type * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { type Areas, createAreas } from './areas/areas';
import { Benches } from './benches';
import { Bricks } from './bricks';
import { Bushes } from './bushes';
import { Confetti } from './confetti';
import { ExplosiveCrates } from './explosiveCrates';
import { Fences } from './fences';
import { Fireballs } from './fireballs';
import { Floor } from './floor';
import { Flowers } from './flowers';
import { Grass } from './grass';
import { Grid } from './grid';
import { Intro } from './intro';
import { IslandTrees, JUNGLE_SPECIES, mixGroves, PALM } from './islandTrees';
import { Lanterns } from './lanterns';
import { Lightnings } from './lightnings';
import { PoleLights } from './poleLights';
import { RainLines } from './rainLines';
import { Scenery } from './scenery';
import { pruneShadowCasters } from './shadowCasters';
import { VisualVehicle } from './visualVehicle';
import { WaterSurface } from './waterSurface';
import { WindLines } from './windLines';

const PALM_REFERENCE_MODELS = ['cherryTreesReferencesModel', 'birchTreesReferencesModel'] as const;
const JUNGLE_REFERENCE_MODEL = 'oakTreesReferencesModel';

function plantIslandTrees(): IslandTrees {
  const references = (name: string): THREE.Object3D[] => getGame().model(name).scene.children;
  return new IslandTrees([
    { species: PALM, references: PALM_REFERENCE_MODELS.flatMap(references) },
    ...mixGroves(JUNGLE_SPECIES, references(JUNGLE_REFERENCE_MODEL)),
  ]);
}

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
    this.bushes = new Bushes();
    this.islandTrees = plantIslandTrees();
    this.flowers = new Flowers();
    this.bricks = new Bricks();
    this.fences = new Fences();
    this.benches = new Benches();
    this.explosiveCrates = new ExplosiveCrates();
    this.poleLights = new PoleLights();
    this.lanterns = new Lanterns();
    this.scenery = new Scenery();
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
