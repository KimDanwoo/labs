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
  distanceToRiver,
  coastDistanceAt,
  groundHeightAt,
  waterDepthAt,
  waterBedDepthAt,
  riverOffsetAt,
  riverWidthAt,
  OCEAN,
  FOG,
  HAZE,
  nearestRiverX,
  RIDGES,
  RIVER,
  RIVER_TRENCH_HALF_WIDTH,
  riverBearing,
  riverBedDepthAt,
  riverWaterDepthAt,
  TERRAIN,
  terrainHeightAt,
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

// 강 골과 그 주변 maskNear 폭은 평지여야 하상·수면·강둑 전제가 맞는다. 최대 경사는 말이 미끄러지지 않을 만큼 완만하게.
test('지형 기복은 강 주변에서 0이고 경사가 완만하다', () => {
  for (const z of [0, 37, -120]) {
    const center = nearestRiverX(RIVER.firstX, z);
    assert.equal(terrainHeightAt(center, z), 0);
    const edge = center + (RIVER_TRENCH_HALF_WIDTH + TERRAIN.maskNear - 0.001) * riverWidthAt(z);
    assert.equal(terrainHeightAt(edge, z), 0);
  }
  const maxSlope = TERRAIN.waves.reduce((sum, w) => sum + w.amp * Math.hypot(w.kx, w.kz), 0);
  assert.ok(maxSlope < 0.25, `최대 경사 ${maxSlope.toFixed(3)} < 0.25`);
  assert.notEqual(terrainHeightAt(0, 0), 0);
});

// 강 평면 한 장이 앞뒤 안개 시야를 덮어야 끝이 안 보인다.
test('강 평면 길이가 안개 시야를 앞뒤로 덮는다', () => {
  for (const fog of Object.values(FOG)) assert.ok(RIVER.length > fog.far * 2, `${RIVER.length} > ${fog.far * 2}`);
});

// 헤이즈 원통 위 끝이 가장 높은 능선보다 높아야 봉우리가 평평하게 잘리지 않는다.
test('능선 최고 높이가 헤이즈 원통 안에 든다', () => {
  for (const ridge of RIDGES) {
    assert.ok(ridge.baseY + ridge.ampY < HAZE.topY, `${ridge.baseY + ridge.ampY} < ${HAZE.topY}`);
  }
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

test('curved channel stays aligned with water depth, banks and terrain on both sides', () => {
  for (let z = -1200; z < 900; z += 17) {
    const center = nearestRiverX(110, z);
    const width = riverWidthAt(z);
    assert.ok(width > 0);
    assert.ok(Math.abs(distanceToRiver(center, z)) < 1e-8);
    for (const side of [-1, 1]) {
      const shore = center + side * RIVER.halfWidth * width;
      assert.ok(Math.abs(riverBedDepthAt(distanceToRiver(shore, z)) - RIVER.waterDrop) < 0.03);
      const bank = center + side * RIVER_TRENCH_HALF_WIDTH * width;
      assert.ok(riverBedDepthAt(distanceToRiver(bank, z)) < 1e-8);
      assert.equal(terrainHeightAt(bank, z), 0);
    }
  }
});

test('the estuary opens into a continuous sea with a dry beach and a submerged shelf', () => {
  assert.ok(RIVER.halfWidth * 2 >= 72);
  assert.ok(riverWidthAt(880) > riverWidthAt(400) * 2);
  for (const x of [-3000, -500, 0, 110, 700, 4000]) {
    const shoreline = OCEAN.coastZ - coastDistanceAt(x, OCEAN.coastZ);
    assert.ok(waterDepthAt(x, shoreline + OCEAN.shelfLength) >= OCEAN.depth - 1e-8);
    assert.ok(groundHeightAt(x, shoreline + OCEAN.shelfLength) < -RIVER.waterDrop);
    for (let z = shoreline - 50; z <= shoreline + 200; z += 0.5) {
      assert.ok(Number.isFinite(groundHeightAt(x, z)));
      assert.ok(Math.abs(groundHeightAt(x, z + 0.5) - groundHeightAt(x, z)) < 0.25);
      assert.equal(waterDepthAt(x, z), Math.max(0, waterBedDepthAt(x, z) - RIVER.waterDrop));
    }
  }
  const x = 600;
  const shore = OCEAN.coastZ - coastDistanceAt(x, OCEAN.coastZ);
  assert.equal(waterDepthAt(x, shore - OCEAN.beachWidth), 0);
});

test('river mesh switching remains outside visibility even at the widest estuary', () => {
  const bend = RIVER.bends.reduce((n, w) => n + w.amplitude, 0);
  const width = (1 + RIVER.widthWaves.reduce((n, w) => n + w.amplitude, 0)) * (1 + OCEAN.estuaryExpansion);
  for (const fog of Object.values(FOG)) {
    assert.ok(RIVER.period / 2 - 2 * bend - RIVER_TRENCH_HALF_WIDTH * width > fog.far);
  }
  assert.equal(riverOffsetAt(0), 0);
});
