import type * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { AchievementsArea } from '@views/drive/lib/engine/game/world/areas/achievementsArea';
import { AltarArea } from '@views/drive/lib/engine/game/world/areas/altarArea';
import { forEachAreaModel } from '@views/drive/lib/engine/game/world/areas/areaModels';
import { BeachGoalArea } from '@views/drive/lib/engine/game/world/areas/beachGoalArea';
import { BehindTheSceneArea } from '@views/drive/lib/engine/game/world/areas/behindTheSceneArea';
import { CareerArea } from '@views/drive/lib/engine/game/world/areas/careerArea';
import { CircuitArea } from '@views/drive/lib/engine/game/world/areas/circuitArea';
import { CookieArea } from '@views/drive/lib/engine/game/world/areas/cookieArea';
import { LabArea } from '@views/drive/lib/engine/game/world/areas/labArea';
import { LandingArea } from '@views/drive/lib/engine/game/world/areas/landingArea';
import { ProjectsArea } from '@views/drive/lib/engine/game/world/areas/projectsArea';
import { ShowerArea } from '@views/drive/lib/engine/game/world/areas/showerArea';
import { SocialArea } from '@views/drive/lib/engine/game/world/areas/socialArea';
import { TimeMachineArea } from '@views/drive/lib/engine/game/world/areas/timeMachineArea';
import { applyIslandTextures } from '@views/drive/lib/engine/game/world/islandTextures';
import { areaQuaternion, placedInArea } from '@views/drive/lib/engine/game/world/layout/areaPlacement';

interface AreaTypes {
  achievements: AchievementsArea;
  altar: AltarArea;
  beachGoal: BeachGoalArea;
  behindTheScene: BehindTheSceneArea;
  career: CareerArea;
  circuit: CircuitArea;
  cookie: CookieArea;
  lab: LabArea;
  landing: LandingArea;
  projects: ProjectsArea;
  social: SocialArea;
  toilet: ShowerArea;
  timeMachine: TimeMachineArea;
}

export type Areas = Partial<AreaTypes>;
type AreaName = keyof AreaTypes;

const AREA_BUILDERS: { [K in AreaName]: (model: THREE.Object3D) => AreaTypes[K] } = {
  achievements: (model) => new AchievementsArea(model),
  altar: (model) => new AltarArea(model),
  beachGoal: (model) => new BeachGoalArea(model),
  behindTheScene: (model) => new BehindTheSceneArea(model),
  career: (model) => new CareerArea(model),
  circuit: (model) => new CircuitArea(model),
  cookie: (model) => new CookieArea(model),
  lab: (model) => new LabArea(model),
  landing: (model) => new LandingArea(model),
  projects: (model) => new ProjectsArea(model),
  social: (model) => new SocialArea(model),
  toilet: (model) => new ShowerArea(model),
  timeMachine: (model) => new TimeMachineArea(model),
};

const UPSTREAM_MODEL_NAMES = new Map<string, AreaName>([['bowling', 'beachGoal']]);

const isAreaName = (name: string): name is AreaName => name in AREA_BUILDERS;
const AREA_NAMES = Object.keys(AREA_BUILDERS).filter(isAreaName);

function buildArea<K extends AreaName>(areas: Areas, name: K, model: THREE.Object3D): void {
  model.position.copy(placedInArea(name, model.position));
  model.quaternion.premultiply(areaQuaternion(name));
  areas[name] = AREA_BUILDERS[name](model);
}

export function createAreas(): Areas {
  const game = getGame();
  const { scene } = game.model('areasModel');
  applyIslandTextures(scene, game.resources);
  for (const child of scene.children) child.name = UPSTREAM_MODEL_NAMES.get(child.name) ?? child.name;

  const areas: Areas = {};
  forEachAreaModel([...scene.children], AREA_NAMES, (name, model) => buildArea(areas, name, model));
  return areas;
}
