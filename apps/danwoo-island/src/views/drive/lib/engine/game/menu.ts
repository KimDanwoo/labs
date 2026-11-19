import { Events } from './events';
import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputTypes';
import { isShown, type PanelState } from './panelState';
import { Tabs } from './tabs';
import { requireElement } from './utilities/requireElement';

type PanelEvents = { open: []; close: []; opened: []; closed: [] };

export interface MenuItem {
  readonly name: string;
  readonly navigationElement: HTMLElement;
  readonly contentElement: HTMLElement;
  readonly mainFocus: HTMLElement | null;
  readonly events: Events<PanelEvents>;
  readonly tabs: Tabs | null;
  isOpen: boolean;
  prevName: string;
  nextName: string;
}

const GAMEPAD_ACTIONS = [
  { name: 'next', categories: ['menu'], keys: ['Gamepad.r1'] },
  { name: 'prev', categories: ['menu'], keys: ['Gamepad.l1'] },
];

function isRacing(): boolean {
  return getGame().world.areas?.circuit?.isRacing ?? false;
}

function onNextFrame(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

function createItem(navigationElement: HTMLElement, contents: readonly HTMLElement[]): MenuItem {
  const name = navigationElement.dataset.name ?? '';
  const contentElement = contents.find((element) => element.classList.contains(`${name}-content`));
  if (!contentElement) throw new Error(`Missing menu content: ${name}`);
  const tabsElement = contentElement.querySelector<HTMLElement>('.js-tabs');
  return {
    name,
    navigationElement,
    contentElement,
    mainFocus: contentElement.querySelector<HTMLElement>('.js-main-focus'),
    events: new Events<PanelEvents>(),
    tabs: tabsElement ? new Tabs(tabsElement) : null,
    isOpen: false,
    prevName: name,
    nextName: name,
  };
}

export class Menu {
  readonly events = new Events<PanelEvents>();
  readonly items = new Map<string, MenuItem>();
  state: PanelState = 'closed';
  readonly #element = requireElement(document, '.js-menu', HTMLElement);
  readonly #default: MenuItem;
  #current: MenuItem | null = null;

  constructor() {
    this.#bindTrigger();
    this.#bindClose();
    this.#default = this.#createItems();
    this.#bindGamepad();
    this.#element.addEventListener('transitionend', () => this.#onTransitionEnd());
  }

  #createItems(): MenuItem {
    const navigation = requireElement(this.#element, '.js-navigation', HTMLElement);
    const contents = [
      ...requireElement(this.#element, '.js-contents', HTMLElement).querySelectorAll<HTMLElement>('.js-content'),
    ];
    for (const navigationElement of navigation.querySelectorAll<HTMLElement>('.js-navigation-item')) {
      const item = createItem(navigationElement, contents);
      navigationElement.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(item.name);
      });
      this.items.set(item.name, item);
    }

    const names = [...this.items.keys()];
    for (const [index, name] of names.entries()) {
      const item = this.items.get(name);
      if (!item) continue;
      item.prevName = names.at(index - 1) ?? name;
      item.nextName = names[(index + 1) % names.length] ?? name;
    }
    const first = this.items.get(names[0] ?? '');
    if (!first) throw new Error('Menu has no items');
    return first;
  }

  #onTransitionEnd(): void {
    const current = this.#current;
    if (!current) return;
    if (this.state === 'opening') {
      this.state = 'open';
      this.events.trigger('opened');
      current.events.trigger('opened');
    } else if (this.state === 'closing') {
      this.state = 'closed';
      this.events.trigger('closed');
      current.events.trigger('closed');
      this.#element.classList.remove('is-displayed');
    }
  }

  #bindTrigger(): void {
    const trigger = requireElement(document, '.js-menu-trigger', HTMLElement);
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(isRacing() ? 'circuit' : null);
    });
    trigger.addEventListener('keydown', (event) => event.preventDefault());
  }

  #bindClose(): void {
    for (const element of this.#element.querySelectorAll('.js-close')) {
      element.addEventListener('click', () => this.close());
    }
    this.#element.addEventListener('click', (event) => {
      if (event.target === this.#element) this.close();
    });
  }

  #bindGamepad(): void {
    const { inputs } = getGame();
    inputs.addActions(GAMEPAD_ACTIONS);
    inputs.events.on('next', (action) => {
      if (action.active && this.#current) this.open(this.#current.nextName);
    });
    inputs.events.on('prev', (action) => {
      if (action.active && this.#current) this.open(this.#current.prevName);
    });
  }

  open(name: string | null = null): void {
    const game = getGame();
    const item = this.items.get(name ?? this.#current?.name ?? this.#default.name);
    if (!item) return;
    if (isShown(this.state) && item === this.#current) return;

    game.audio.groups.get('click')?.play(true);
    if (this.#current) {
      this.#current.navigationElement.classList.remove('is-active');
      this.#current.contentElement.classList.remove('is-visible');
      this.#current.isOpen = false;
    }
    item.navigationElement.classList.add('is-active');
    item.contentElement.classList.add('is-visible');
    item.isOpen = true;
    this.#current = item;

    const { mainFocus } = item;
    if (mainFocus && game.inputs.mode !== INPUT_MODE.touch) requestAnimationFrame(() => mainFocus.focus());
    game.inputs.filters.clear();
    game.inputs.filters.add('menu');
    this.events.trigger('open');
    item.events.trigger('open');

    if (isShown(this.state)) return;
    this.state = 'opening';
    this.#element.classList.add('is-displayed');
    onNextFrame(() => this.#element.classList.add('is-visible'));
  }

  close(): void {
    if (!isShown(this.state) || !this.#current) return;
    getGame().audio.groups.get('click')?.play(false);
    this.#element.classList.remove('is-visible');
    this.state = 'closing';
    this.events.trigger('close');
    this.#current.isOpen = false;
    this.#current.events.trigger('close');
  }

  preopen(): void {
    for (const item of this.items.values()) {
      if (item.navigationElement.dataset.preopen !== undefined) this.open(item.name);
    }
  }
}
