import {
  AREA_ANCHORS,
  BRIDGES,
  type AreaKey,
  type BridgeSpan,
  type Point,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { ISLAND_SCATTER } from '../../src/views/drive/lib/engine/game/world/layout/islandScatter';
import { boxDistance, landDistance, trackClearance, zoneBox } from './fields';

type Box = readonly [from: Point, to: Point];

const STEP = 1;
const ENTRY_MARGIN = 5;
const TRACK_ROOM = 1;
const BRIDGE_SAMPLES = 10;

const zones = Object.entries(AREA_ANCHORS) as [AreaKey, (typeof AREA_ANCHORS)[AreaKey]][];
const props = Object.values(ISLAND_SCATTER).flatMap((list) => list.map(([x, z]): Point => [x, z]));

const grown = ([from, to]: Box, margin: number): Box => [
  [from[0] - margin, from[1] - margin],
  [to[0] + margin, to[1] + margin],
];

const isInside = (point: Point, [from, to]: Box): boolean => boxDistance(point, from, to) < 0;

const overlaps = ([aFrom, aTo]: Box, [bFrom, bTo]: Box): boolean =>
  aFrom[0] < bTo[0] && bFrom[0] < aTo[0] && aFrom[1] < bTo[1] && bFrom[1] < aTo[1];

function cells([from, to]: Box): Point[] {
  const points: Point[] = [];
  for (let x = from[0]; x <= to[0]; x += STEP) for (let z = from[1]; z <= to[1]; z += STEP) points.push([x, z]);
  return points;
}

const wetCells = (box: Box): number => cells(box).filter((point) => landDistance(point) < 0).length;
const propsIn = (box: Box): number => props.filter((point) => isInside(point, box)).length;
const touchesTrack = (box: Box): boolean => cells(box).some((point) => trackClearance(point) < TRACK_ROOM);

function bridgeSamples({ from, to }: BridgeSpan): Point[] {
  return Array.from({ length: BRIDGE_SAMPLES + 1 }, (_, index): Point => {
    const along = index / BRIDGE_SAMPLES;
    return [from[0] + (to[0] - from[0]) * along, from[1] + (to[1] - from[1]) * along];
  });
}

function zoneProblems(name: AreaKey): string[] {
  const { placed, bounds } = AREA_ANCHORS[name];
  const box = zoneBox(placed, bounds);
  const wet = wetCells(grown(box, ENTRY_MARGIN));
  return [
    wet > 0 ? `${name}: 둘레 ${ENTRY_MARGIN}m 안에 물 ${wet}칸` : '',
    propsIn(box) > 0 ? `${name}: 구역 안에 소품 ${propsIn(box)}개` : '',
    name !== 'circuit' && touchesTrack(box) ? `${name}: 트랙과 겹침` : '',
  ];
}

function runUpProblems(name: AreaKey): string[] {
  const { placed, runUp } = AREA_ANCHORS[name];
  if (!runUp) return [];
  const box = zoneBox(placed, runUp);
  const blockers = zones.filter(
    ([other, anchor]) => other !== name && overlaps(box, zoneBox(anchor.placed, anchor.bounds)),
  );
  const bridges = BRIDGES.filter((bridge) => bridgeSamples(bridge).some((point) => isInside(point, box)));
  return [
    wetCells(box) > 0 ? `${name}: 도움닫기에 물 ${wetCells(box)}칸` : '',
    propsIn(box) > 0 ? `${name}: 도움닫기에 소품 ${propsIn(box)}개` : '',
    touchesTrack(box) ? `${name}: 도움닫기가 트랙과 겹침` : '',
    ...blockers.map(([other]) => `${name}: 도움닫기를 ${other}가 막음`),
    ...bridges.map(({ from }) => `${name}: 도움닫기에 다리 [${from.join(', ')}]`),
  ];
}

function bridgeProblems(): string[] {
  return BRIDGES.filter((bridge) => bridgeSamples(bridge).every((point) => landDistance(point) >= 0)).map(
    ({ from, to }) => `다리 [${from.join(', ')}]→[${to.join(', ')}]: 물을 건너지 않음`,
  );
}

function layoutProblems(): string[] {
  return [...zones.flatMap(([name]) => [...zoneProblems(name), ...runUpProblems(name)]), ...bridgeProblems()].filter(
    Boolean,
  );
}

const problems = layoutProblems();
process.stdout.write(problems.length ? `${problems.join('\n')}\n` : '배치 문제 없음\n');
process.exitCode = problems.length ? 1 : 0;
