// 강 배치 불변식 체크: node scripts/test-river.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GRASS_FIELD,
  GRASS_QUALITY,
  grassKeepAt,
  grassViewRadius,
} from '../src/entities/grass/model/constants/index.ts';
import {
  FOG,
  RIVER,
  RIVER_TRENCH_HALF_WIDTH,
  distanceToRiver,
  nearestRiverX,
  riverBearing,
  riverBedDepthAt,
  riverWaterDepthAt,
} from '../src/shared/config/scene.ts';

test('스폰 지점에서 첫 강까지 firstX만큼 떨어져 있다', () => {
  assert.equal(nearestRiverX(0), RIVER.firstX);
  assert.equal(distanceToRiver(0), RIVER.firstX);
});

test('강은 period 간격으로 좌우 양쪽에 반복된다', () => {
  const { firstX, period } = RIVER;
  for (const k of [-2, -1, 0, 1, 2]) {
    const center = firstX + period * k;
    assert.equal(nearestRiverX(center), center);
    assert.equal(distanceToRiver(center), 0);
    assert.equal(distanceToRiver(center + RIVER.halfWidth - 0.1) < RIVER.halfWidth, true);
    assert.equal(distanceToRiver(center + RIVER.halfWidth + 0.1) < RIVER.halfWidth, false);
  }
});

// 이 불변식이 깨지면 강이 두 개 동시에 보여 평면 한 장으로는 부족해진다.
test('강 사이 중간 지점에서 어느 강도 안개 시야 안에 들어오지 않는다', () => {
  const midpoint = RIVER.firstX - RIVER.period / 2;
  assert.equal(distanceToRiver(midpoint), RIVER.period / 2);
  for (const fog of Object.values(FOG)) assert.equal(RIVER.period / 2 > fog.far, true);
});

// blade는 청크 커버 끝보다 먼저 지면색에 완전히 녹아야 청크 경계가 안 보인다. 안개는 그 뒤에 닫힌다.
test('잔디 blade가 청크 끝보다 먼저 지면에 녹는다', () => {
  for (const [quality, grass] of Object.entries(GRASS_QUALITY)) {
    const coverage = (grassViewRadius(quality) + 0.5) * GRASS_FIELD.tile;
    assert.ok(grass.fadeFar < coverage, `${quality}: fadeFar ${grass.fadeFar} < coverage ${coverage}`);
    assert.ok(grass.fadeFar <= FOG[quality].far, `${quality}: 잔디가 안개보다 먼저 닫힌다`);
  }
});

// 하상 프로파일: 중앙이 가장 깊고 골 가장자리에서 지면(0)과 만나야 Ground 구멍 테두리와 맞물린다.
test('하상은 중앙에서 depth, 골 가장자리에서 0', () => {
  assert.equal(riverBedDepthAt(0), RIVER.depth);
  assert.equal(riverBedDepthAt(RIVER.slopeStart), RIVER.depth);
  assert.equal(riverBedDepthAt(RIVER_TRENCH_HALF_WIDTH), 0);
  assert.equal(riverWaterDepthAt(RIVER_TRENCH_HALF_WIDTH), 0);
});

// halfWidth는 HUD·잔디가 쓰는 명목 수면 반폭. 프로파일이 거기서 수면과 만나지 않으면 안내와 실제 물가가 어긋난다.
test('수면선이 halfWidth 근처에 온다', () => {
  const TOLERANCE_M = 0.03;
  assert.ok(Math.abs(riverBedDepthAt(RIVER.halfWidth) - RIVER.waterDrop) < TOLERANCE_M);
  assert.ok(riverWaterDepthAt(RIVER.halfWidth - 1) > 0);
  assert.equal(riverWaterDepthAt(RIVER.halfWidth + 1), 0);
});

// 카메라가 말 뒤에서 +Z를 보므로 화면 오른쪽 축은 world -X다. 이 부호가 뒤집히면 안내가 반대를 가리킨다.
test('강 방위는 화면 기준으로 나온다', () => {
  const RIGHT_ANGLE = Math.PI / 2;
  assert.equal(riverBearing(0, 0), 'left');
  assert.equal(riverBearing(RIVER.firstX + RIVER.halfWidth * 2, 0), 'right');
  assert.equal(riverBearing(0, RIGHT_ANGLE), 'ahead');
  assert.equal(riverBearing(0, -RIGHT_ANGLE), 'behind');
});

test('물속에서는 방위 대신 crossing', () => {
  assert.equal(riverBearing(RIVER.firstX, 0), 'crossing');
  assert.equal(riverBearing(RIVER.firstX + RIVER.halfWidth - 0.1, 0), 'crossing');
  assert.notEqual(riverBearing(RIVER.firstX + RIVER.halfWidth + 0.1, 0), 'crossing');
});

// 링 안쪽 경계에서 보여야 하는 blade 수(첫 링 풀 × keep)가 그 링의 풀보다 크면 경계에서 잔디가 튄다.
test('LOD 링 풀이 경계 거리의 keep을 감당한다', () => {
  for (const [quality, grass] of Object.entries(GRASS_QUALITY)) {
    const fullPool = grass.rings[0].blades;
    for (let i = 1; i < grass.rings.length; i += 1) {
      const innerEdge = (grass.rings[i - 1].maxRing + 0.5) * GRASS_FIELD.tile;
      const needed = fullPool * grassKeepAt(innerEdge);
      assert.ok(
        grass.rings[i].blades >= needed,
        `${quality} ring ${i}: pool ${grass.rings[i].blades} < needed ${needed.toFixed(0)} at ${innerEdge}m`,
      );
    }
  }
});
