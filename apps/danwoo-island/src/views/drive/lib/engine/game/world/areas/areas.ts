import type * as THREE from 'three/webgpu';

import { getGame } from '../../gameContext';
import { applyIslandTextures } from '../islandTextures';
import { AchievementsArea } from './achievementsArea';
import { AltarArea } from './altarArea';
import { forEachAreaModel } from './areaModels';
import { BehindTheSceneArea } from './behindTheSceneArea';
import { BowlingArea } from './bowlingArea';
import { CareerArea } from './careerArea';
import { CircuitArea } from './circuitArea';
import { CookieArea } from './cookieArea';
import { LabArea } from './labArea';
import { LandingArea } from './landingArea';
import { ProjectsArea } from './projectsArea';
import { SocialArea } from './socialArea';
import { TimeMachineArea } from './timeMachineArea';
import { ToiletArea } from './toiletArea';

interface AreaTypes {
  achievements: AchievementsArea;
  altar: AltarArea;
  behindTheScene: BehindTheSceneArea;
  bowling: BowlingArea;
  career: CareerArea;
  circuit: CircuitArea;
  cookie: CookieArea;
  lab: LabArea;
  landing: LandingArea;
  projects: ProjectsArea;
  social: SocialArea;
  toilet: ToiletArea;
  timeMachine: TimeMachineArea;
}

export type Areas = Partial<AreaTypes>;
type AreaName = keyof AreaTypes;

const AREA_BUILDERS: { [K in AreaName]: (model: THREE.Object3D) => AreaTypes[K] } = {
  achievements: (model) => new AchievementsArea(model),
  altar: (model) => new AltarArea(model),
  behindTheScene: (model) => new BehindTheSceneArea(model),
  bowling: (model) => new BowlingArea(model),
  career: (model) => new CareerArea(model),
  circuit: (model) => new CircuitArea(model),
  cookie: (model) => new CookieArea(model),
  lab: (model) => new LabArea(model),
  landing: (model) => new LandingArea(model),
  projects: (model) => new ProjectsArea(model),
  social: (model) => new SocialArea(model),
  toilet: (model) => new ToiletArea(model),
  timeMachine: (model) => new TimeMachineArea(model),
};

const isAreaName = (name: string): name is AreaName => name in AREA_BUILDERS;
const AREA_NAMES = Object.keys(AREA_BUILDERS).filter(isAreaName);

function buildArea<K extends AreaName>(areas: Areas, name: K, model: THREE.Object3D): void {
  areas[name] = AREA_BUILDERS[name](model);
}

export function createAreas(): Areas {
  const game = getGame();
  const { scene } = game.model('areasModel');
  applyIslandTextures(scene, game.resources);

  const areas: Areas = {};
  forEachAreaModel([...scene.children], AREA_NAMES, (name, model) => buildArea(areas, name, model));
  return areas;
}
