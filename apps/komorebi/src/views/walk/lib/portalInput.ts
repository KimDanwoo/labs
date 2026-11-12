const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
type PortalInput = {
  arrive: (held: Iterable<string>) => void;
  isBlocked: (key: string) => boolean;
  release: (key: string) => void;
  clear: () => void;
};

export function createPortalInput(): PortalInput {
  const heldAcrossDoor = new Set<string>();
  return {
    arrive(held) {
      for (const key of held) if (MOVEMENT_KEYS.has(key)) heldAcrossDoor.add(key);
    },
    isBlocked: (key) => heldAcrossDoor.has(key),
    release(key) {
      heldAcrossDoor.delete(key);
    },
    clear() {
      heldAcrossDoor.clear();
    },
  };
}
