import * as THREE from 'three/webgpu';

function copyWithoutUserData<T extends THREE.Object3D>(this: T, source: THREE.Object3D, recursive = true): T {
  this.name = source.name;
  this.up.copy(source.up);
  this.position.copy(source.position);
  this.rotation.order = source.rotation.order;
  this.quaternion.copy(source.quaternion);
  this.scale.copy(source.scale);
  this.matrix.copy(source.matrix);
  this.matrixWorld.copy(source.matrixWorld);
  this.matrixAutoUpdate = source.matrixAutoUpdate;
  this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
  this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
  this.layers.mask = source.layers.mask;
  this.visible = source.visible;
  this.castShadow = source.castShadow;
  this.receiveShadow = source.receiveShadow;
  this.frustumCulled = source.frustumCulled;
  this.renderOrder = source.renderOrder;
  this.animations = source.animations.slice();
  if (recursive) for (const child of source.children) this.add(child.clone());
  return this;
}

THREE.Object3D.prototype.copy = copyWithoutUserData;
