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
import { Lanterns } from './lanterns';
import { Lightnings } from './lightnings';
import { PalmTrees } from './palmTrees';
import { PoleLights } from './poleLights';
import { RainLines } from './rainLines';
import { Scenery } from './scenery';
import { Snow } from './snow';
import { Trees } from './trees';
import { VisualVehicle } from './visualVehicle';
import { WaterSurface } from './waterSurface';
import { WindLines } from './windLines';

interface TreeSpecies {
  model: string;
  colorA: string;
  colorB: string;
}

const BIRCH: TreeSpecies = { model: 'birchTrees', colorA: '#4F9B65', colorB: '#A8D878' };
const OAK: TreeSpecies = { model: 'oakTrees', colorA: '#287A59', colorB: '#70BA69' };

function plantTrees({ model, colorA, colorB }: TreeSpecies): Trees {
  const game = getGame();
  const visual = game.model(`${model}VisualModel`).scene;
  const references = game.model(`${model}ReferencesModel`).scene.children;
  return new Trees({ visual, references, colorA, colorB });
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
  snow: Snow | null = null;
  bushes: Bushes | null = null;
  birchTrees: Trees | null = null;
  oakTrees: Trees | null = null;
  palmTrees: PalmTrees | null = null;
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
    this.snow = new Snow();
    this.bushes = new Bushes();
    this.birchTrees = plantTrees(BIRCH);
    this.oakTrees = plantTrees(OAK);
    this.palmTrees = new PalmTrees(getGame().model('cherryTreesReferencesModel').scene.children);
    this.flowers = new Flowers();
    this.bricks = new Bricks();
    this.fences = new Fences();
    this.benches = new Benches();
    this.explosiveCrates = new ExplosiveCrates();
    this.poleLights = new PoleLights();
    this.lanterns = new Lanterns();
    this.scenery = new Scenery();
    this.areas = createAreas();
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
    const { bowling, cookie, toilet, social } = this.areas ?? {};
    this.explosiveCrates?.reset();
    bowling?.restart();
    cookie?.refreshAfterReset();
    toilet?.refreshAfterReset();
    social?.refreshAfterReset();
    for (const decoration of [this.benches, this.fences, this.bricks, this.lanterns]) {
      if (decoration) decoration.instancedGroup.needsUpdate = true;
    }
  }
}
