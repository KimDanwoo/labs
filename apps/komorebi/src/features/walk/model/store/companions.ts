import {
  COMPANION_KEY,
  EMPTY_COMPANIONS,
  changeCompanions,
  parseCompanions,
  type CompanionAction,
  type Companions,
} from '@features/walk/lib/companions';

let current: Companions | undefined;
const listeners = new Set<() => void>();
function read() {
  try {
    return parseCompanions(localStorage.getItem(COMPANION_KEY));
  } catch {
    return EMPTY_COMPANIONS;
  }
}
function sync(event: StorageEvent) {
  if (event.key !== COMPANION_KEY && event.key !== null) return;
  current = read();
  listeners.forEach((listener) => listener());
}
export const companionStore = {
  get() {
    return (current ??= read());
  },
  getServer: () => EMPTY_COMPANIONS,
  subscribe(listener: () => void) {
    if (!listeners.size) window.addEventListener('storage', sync);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (!listeners.size) window.removeEventListener('storage', sync);
    };
  },
  act(action: CompanionAction) {
    const before = companionStore.get();
    const next = changeCompanions(before, action);
    if (before === next) return { changed: false, saved: true };
    current = next;
    let saved = true;
    try {
      localStorage.setItem(COMPANION_KEY, JSON.stringify(next));
    } catch {
      saved = false;
    }
    listeners.forEach((listener) => listener());
    return { changed: true, saved };
  },
};
