import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputs';
import { isShown } from './panelState';
import { CircuitArea } from './world/areas/circuitArea';
import { LabArea } from './world/areas/labArea';
import { ProjectsArea } from './world/areas/projectsArea';

const ACTION_CATEGORIES = ['modal', 'menu', 'racing', 'cinematic', 'wandering'];
const ACTIONS = [
  { name: 'close', categories: ACTION_CATEGORIES, keys: ['Keyboard.Escape', 'Gamepad.cross'] },
  { name: 'pause', categories: ACTION_CATEGORIES, keys: ['Gamepad.start'] },
];

function circuitState(): unknown {
  return getGame().world.areas?.circuit?.state;
}

function isRacing(): boolean {
  const state = circuitState();
  return state === CircuitArea.STATE_RUNNING || state === CircuitArea.STATE_STARTING;
}

function isInRace(): boolean {
  return isRacing() || circuitState() === CircuitArea.STATE_ENDING;
}

function closeOpenArea(): boolean {
  const { areas } = getGame().world;
  const { projects, lab } = areas ?? {};
  if (projects && (projects.state === ProjectsArea.STATE_OPEN || projects.state === ProjectsArea.STATE_OPENING)) {
    projects.close();
    return true;
  }
  if (lab && (lab.state === LabArea.STATE_OPEN || lab.state === LabArea.STATE_OPENING)) {
    lab.close();
    return true;
  }
  return false;
}

export class ClosingManager {
  constructor() {
    const { inputs, menu, modals } = getGame();
    inputs.addActions(ACTIONS);

    inputs.events.on('close', (action) => {
      if (action.active) this.#close(action.activeKeys.has('Keyboard.Escape'));
    });
    inputs.events.on('pause', (action) => {
      if (!action.active) return;
      if (isShown(menu.state)) menu.close();
      else menu.open('home');
    });
    modals.events.on('open', () => {
      if (isShown(menu.state)) menu.close();
    });
    menu.events.on('open', () => {
      if (isShown(modals.state)) modals.close();
    });
    const restoreFilters = (): void => {
      inputs.filters.clear();
      inputs.filters.add(isInRace() ? 'racing' : 'wandering');
    };
    modals.events.on('close', restoreFilters);
    menu.events.on('close', restoreFilters);
  }

  #close(isEscape: boolean): void {
    const { inputs, menu, modals } = getGame();
    const isMenuClosable = menu.state === 'open' || (inputs.mode !== INPUT_MODE.gamepad && menu.state === 'opening');
    if (modals.state === 'open') modals.close();
    else if (isMenuClosable) menu.close();
    else if (isRacing()) menu.open('circuit');
    else if (closeOpenArea()) return;
    else if (isEscape) menu.open();
  }
}
