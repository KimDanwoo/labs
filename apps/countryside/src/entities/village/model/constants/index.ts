export const VILLAGE_COLORS = {
  trunk: '#9a6f49',
  foliageA: '#7cbb63',
  foliageB: '#5f9f58',
  foliageC: '#a7d27e',
  hayTop: '#e7c768',
  haySide: '#d2a945',
  pond: '#88c6e0',
  pondEdge: '#9bcf7e',
  chimney: '#a06a55',
  door: '#7a5337',
  window: '#dff0ff',
} as const;

const HOUSE_PALETTE = [
  { wall: '#efe2c4', roof: '#c4674b' },
  { wall: '#e3ecd4', roof: '#7f96a8' },
  { wall: '#f1e3c8', roof: '#9a7b53' },
  { wall: '#dfe7d2', roof: '#c0793e' },
  { wall: '#ece0c6', roof: '#8a5038' },
] as const;

// 황금각 나선으로 들판에 흩뿌린다(결정적). 스폰 중앙(반경 < min)은 비운다.
function scatter(index: number, min: number, span: number): [number, number] {
  const angle = index * 2.39996;
  const radius = min + ((index * 7.13) % span);
  return [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)];
}

export type HousePlacement = {
  position: [number, number];
  rotationY: number;
  wall: string;
  roof: string;
  scale: number;
};

export const HOUSES: HousePlacement[] = Array.from({ length: 6 }, (_, i) => {
  const position = scatter(i + 1, 34, 46);
  const palette = HOUSE_PALETTE[i % HOUSE_PALETTE.length]!;
  return {
    position,
    rotationY: i * 1.13,
    wall: palette.wall,
    roof: palette.roof,
    scale: 0.95 + (i % 3) * 0.12,
  };
});

export type TreePlacement = {
  position: [number, number];
  scale: number;
  kind: 'a' | 'b';
};

export const TREES: TreePlacement[] = Array.from({ length: 80 }, (_, i) => ({
  position: scatter(i + 9, 16, 70),
  scale: 0.8 + ((i * 3) % 5) * 0.16,
  kind: i % 2 === 0 ? 'a' : 'b',
}));

export type HaystackPlacement = { position: [number, number]; scale: number };
export const HAYSTACKS: HaystackPlacement[] = Array.from({ length: 5 }, (_, i) => ({
  position: scatter(i * 5 + 3, 24, 56),
  scale: 0.85 + (i % 3) * 0.15,
}));

export const POND = { position: scatter(4, 40, 30), radius: 13 } as const;
