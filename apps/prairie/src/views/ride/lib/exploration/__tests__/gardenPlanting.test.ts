import { createGardenLayout, flowerColors, swayStemMatrix } from '@views/ride/lib/exploration/gardenPlanting';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Color, Matrix4, Object3D } from 'three';

const heightAt = (x: number, z: number) => Math.sin(x * 0.7) * 0.4 + z * 0.02;

function legacyFrame(elapsed: number) {
  const stems: Matrix4[] = [];
  const blooms: Matrix4[] = [];
  const colors: Color[] = [];
  const leaves: Matrix4[] = [];
  const d = new Object3D();
  for (let i = 0; i < 100; i++) {
    const patch = Math.floor(i / 20),
      a = i * 2.39996,
      spread = 0.5 + (i % 20) * 0.13;
    const x = Math.cos(patch * 1.256) * 9 + Math.cos(a) * spread;
    const z = Math.sin(patch * 1.256) * 9 + Math.sin(a) * spread;
    const ground = heightAt(x, z);
    const height = 0.5 + (i % 5) * 0.12;
    d.position.set(x, ground + height * 0.5, z);
    d.rotation.set(0, a, Math.sin(elapsed + i) * 0.06);
    d.scale.set(0.025, height, 0.025);
    d.updateMatrix();
    stems.push(d.matrix.clone());
    for (let petal = 0; petal < 5; petal++) {
      const angle = petal * Math.PI * 0.4;
      d.position.set(x + Math.cos(angle) * 0.15, ground + height, z + Math.sin(angle) * 0.15);
      d.rotation.set(0.3, -angle, 0);
      d.scale.set(0.21, 0.055, 0.11);
      d.updateMatrix();
      blooms.push(d.matrix.clone());
      colors.push(flowerColors[patch % 3]!);
    }
    const column = Math.floor(i / 13) % 8,
      step = i % 13,
      theta = (column * Math.PI) / 4,
      vineAngle = step * 0.65;
    const columnX = Math.cos(theta) * 11,
      columnZ = Math.sin(theta) * 11;
    d.rotation.set(0, theta, column % 2 ? 0.08 : -0.04);
    d.position.set(Math.cos(vineAngle) * 0.95, (step * (2.5 + (column % 3))) / 14, Math.sin(vineAngle) * 0.95);
    d.position.applyEuler(d.rotation);
    d.position.x += columnX;
    d.position.z += columnZ;
    d.position.y += heightAt(columnX, columnZ);
    d.rotation.set(0.4, vineAngle + theta, 0.5);
    d.scale.set(0.2, 0.1, 0.38);
    d.updateMatrix();
    leaves.push(d.matrix.clone());
  }
  return { stems, blooms, colors, leaves };
}

test('the garden is laid out once with the same placement the per-frame loop produced', () => {
  const elapsed = 1.7;
  const legacy = legacyFrame(elapsed);
  const layout = createGardenLayout(heightAt);
  const dummy = new Object3D();
  const stems = layout.stems.map((stem, index) => swayStemMatrix(stem, index, elapsed, dummy).clone());

  assert.deepEqual(
    stems.map((matrix) => matrix.elements),
    legacy.stems.map((matrix) => matrix.elements),
  );
  assert.deepEqual(
    layout.blooms.map((matrix) => matrix.elements),
    legacy.blooms.map((matrix) => matrix.elements),
  );
  assert.deepEqual(layout.bloomColors, legacy.colors);
  assert.deepEqual(
    layout.leaves.map((matrix) => matrix.elements),
    legacy.leaves.map((matrix) => matrix.elements),
  );
});

test('only the stem sway depends on time', () => {
  const layout = createGardenLayout(heightAt);
  const dummy = new Object3D();
  const early = swayStemMatrix(layout.stems[3]!, 3, 0, dummy).clone();
  const late = swayStemMatrix(layout.stems[3]!, 3, 2, dummy).clone();
  assert.notDeepEqual(early.elements, late.elements);
  assert.deepEqual(createGardenLayout(heightAt).blooms, layout.blooms);
});
