import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { HEAD_CROWN } from '../../config/headCrown';

type Vec3 = readonly [number, number, number];

const toVector = ([x, y, z]: Vec3) => new Vector3(x, y, z);

export function mirrored([x, y, z]: Vec3, side: number): [number, number, number] {
  return [side * x, y, z];
}

function makeBrow() {
  const { points, tubularSegments, radius, radialSegments } = HEAD_CROWN.brow;
  return new TubeGeometry(new CatmullRomCurve3(points.map(toVector)), tubularSegments, radius, radialSegments, false);
}

function makeLock(index: number) {
  const { spreadSteps, sideOffsets, tipRise, tubularSegments, radius, radiusTaper, radialSegments } = HEAD_CROWN.locks;
  const side = (index - spreadSteps) / spreadSteps;
  const tip = sideOffsets.length - 1;
  const points = sideOffsets.map(([x, y, z], point) => {
    const rise = point === tip ? Math.abs(side) * tipRise : 0;
    return new Vector3(side * x, y + rise, z);
  });
  return new TubeGeometry(
    new CatmullRomCurve3(points),
    tubularSegments,
    radius - Math.abs(side) * radiusTaper,
    radialSegments,
    false,
  );
}

export function makeHeadCrownGeometry() {
  return {
    brow: makeBrow(),
    locks: Array.from({ length: HEAD_CROWN.locks.count }, (_, index) => makeLock(index)),
  };
}

export type HeadCrownGeometry = ReturnType<typeof makeHeadCrownGeometry>;
