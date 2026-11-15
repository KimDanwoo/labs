import type * as THREE from 'three/webgpu';

const REFERENCE_NAME = /^ref(?:erence)?([^0-9]+)([0-9]+)?$/;

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

export class References {
  readonly items = new Map<string, THREE.Object3D[]>();

  constructor(model?: THREE.Object3D) {
    if (model) this.parse(model);
  }

  parse(object: THREE.Object3D): void {
    object.traverse((child) => {
      const baseName = child.name.match(REFERENCE_NAME)?.[1];
      if (!baseName) return;
      const name = lowerFirst(baseName);
      const existing = this.items.get(name);
      if (existing) existing.push(child);
      else this.items.set(name, [child]);
    });
  }

  getStartingWith(prefix: string): Map<string, THREE.Object3D[]> {
    const matches = new Map<string, THREE.Object3D[]>();
    const stripPrefix = new RegExp(`^${prefix}(.+)$`);
    for (const [name, objects] of this.items) {
      if (name.startsWith(prefix)) matches.set(lowerFirst(name.replace(stripPrefix, '$1')), objects);
    }
    return matches;
  }
}
