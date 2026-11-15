import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputs';
import { isShown } from './panelState';

const ACTION_CATEGORIES = ['modal', 'menu', 'racing', 'cinematic', 'wandering'];
const ACTIONS = [
  { name: 'close', categories: ACTION_CATEGORIES, keys: ['Keyboard.Escape', 'Gamepad.cross'] },
  { name: 'pause', categories: ACTION_CATEGORIES, keys: ['Gamepad.start'] },
];

function isRacing(): boolean {
  return getGame().world.areas?.circuit?.isRacing ?? false;
}

function isInRace(): boolean {
  return isRacing() || getGame().world.areas?.circuit?.state === 'ending';
}

function closeOpenArea(): boolean {
  const { areas } = getGame().world;
  const { projects, lab } = areas ?? {};
  if (projects?.isShown) {
    projects.close();
    return true;
  }
  if (lab?.isShown) {
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
