import { requireElement } from './utilities/requireElement';

interface Tab {
  name: string;
  navigationElement: HTMLElement;
  contentElement: HTMLElement;
}

const ACTIVE_CLASS = 'is-active';

export class Tabs {
  readonly #tabs = new Map<string, Tab>();
  #current: Tab | null = null;

  constructor(element: HTMLElement) {
    const navigation = requireElement(element, '.js-tabs-navigation', HTMLElement);
    const content = requireElement(element, '.js-tabs-content', HTMLElement);
    const contentItems = [...content.querySelectorAll<HTMLElement>('.js-tabs-content-item')];

    let defaultTab: Tab | null = null;
    for (const navigationElement of navigation.querySelectorAll<HTMLElement>('.js-tabs-navigation-item')) {
      const name = navigationElement.dataset.tabsName ?? '';
      const contentElement = contentItems.find((item) => item.classList.contains(name));
      if (!contentElement) throw new Error(`Missing tab content: ${name}`);
      const tab = { name, navigationElement, contentElement };
      navigationElement.addEventListener('click', () => this.goTo(name));
      if (contentElement.dataset.tabsDefault !== undefined) defaultTab = tab;
      this.#tabs.set(name, tab);
    }
    if (defaultTab) this.goTo(defaultTab.name);
  }

  goTo(name: string): void {
    if (name === this.#current?.name) return;
    const tab = this.#tabs.get(name);
    if (!tab) return;
    this.#current?.contentElement.classList.remove(ACTIVE_CLASS);
    this.#current?.navigationElement.classList.remove(ACTIVE_CLASS);
    this.#current = tab;
    tab.contentElement.classList.add(ACTIVE_CLASS);
    tab.navigationElement.classList.add(ACTIVE_CLASS);
  }
}
