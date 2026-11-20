import type { Spot } from '@views/drive/lib/engine/game/world/circuitDecorationConfig';
import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';

const BYEOTGARI = {
  radius: 0.68,
  bottom: -1.01,
  height: 1.46,
  columns: [
    [-24.75, -0.65],
    [-26.68, -2.5],
    [-25.57, -1.66],
    [0.1, 13.81],
    [-1.57, 11.63],
    [-0.72, 12.81],
  ] satisfies readonly Spot[],
  sides: 8,
  flameSides: 5,
  baseHeightRatio: 0.11,
  baseTopRadiusRatio: 0.74,
  shaftBottomRatio: 0.08,
  shaftHeightRatio: 0.7,
  shaftTopRadiusRatio: 0.2,
  shaftBottomRadiusRatio: 0.24,
  bindingRadiusRatio: 0.26,
  bindingHeightRatio: 0.04,
  bindingLevels: [0.28, 0.58],
  bowlBottomRatio: 0.72,
  bowlHeightRatio: 0.16,
  bowlTopRadiusRatio: 0.54,
  bowlBottomRadiusRatio: 0.25,
  flameBottomRatio: 0.85,
  flameHeightRatio: 0.37,
  flameRadiusRatio: 0.32,
  innerFlameHeightRatio: 0.25,
  innerFlameRadiusRatio: 0.21,
  innerFlameOffsetRatio: 0.08,
} as const;
export function byeotgari(parts: Parts): void {
  const style = BYEOTGARI;
  const { radius, bottom, height } = style;
  const baseHeight = height * style.baseHeightRatio;
  const shaftHeight = height * style.shaftHeightRatio;
  const bowlHeight = height * style.bowlHeightRatio;
  const flameHeight = height * style.flameHeightRatio;
  const innerFlameHeight = height * style.innerFlameHeightRatio;
  const bindingRadius = radius * style.bindingRadiusRatio;

  for (const [x, z] of style.columns) {
    parts.prism(
      'sand',
      radius * style.baseTopRadiusRatio,
      radius,
      baseHeight,
      { position: [x, bottom + baseHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bamboo',
      radius * style.shaftTopRadiusRatio,
      radius * style.shaftBottomRadiusRatio,
      shaftHeight,
      { position: [x, bottom + height * style.shaftBottomRatio + shaftHeight / 2, z] },
      style.sides,
    );
    for (const level of style.bindingLevels) {
      parts.prism(
        'thatchRope',
        bindingRadius,
        bindingRadius,
        height * style.bindingHeightRatio,
        { position: [x, bottom + height * level, z] },
        style.sides,
      );
    }
    parts.prism(
      'coconutShell',
      radius * style.bowlTopRadiusRatio,
      radius * style.bowlBottomRadiusRatio,
      bowlHeight,
      { position: [x, bottom + height * style.bowlBottomRatio + bowlHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bunting3',
      0,
      radius * style.flameRadiusRatio,
      flameHeight,
      { position: [x, bottom + height * style.flameBottomRatio + flameHeight / 2, z] },
      style.flameSides,
    );
    parts.prism(
      'bunting2',
      0,
      radius * style.innerFlameRadiusRatio,
      innerFlameHeight,
      {
        position: [
          x + radius * style.innerFlameOffsetRatio,
          bottom + height * style.flameBottomRatio + innerFlameHeight / 2,
          z,
        ],
      },
      style.flameSides,
    );
  }
}
