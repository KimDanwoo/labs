interface GuidePosition {
  pawns: number[];
  walls: number[];
}

export const GUIDE_POSITIONS: [GuidePosition, ...GuidePosition[]] = [
  {
    pawns: [22, 47, 19, 31, 17, 18],
    walls: [4, 5, 6, 8, 22, 23, 30, 32, 33, 37, 39, 45, 48, 50, 51, 56, 60, 62, 63, 65, 71, 79, 80, 93],
  },
  {
    pawns: [34, 17, 28, 16, 6, 45],
    walls: [3, 4, 5, 10, 12, 16, 17, 22, 23, 29, 31, 32, 34, 45, 51, 54, 56, 62, 63, 64, 67, 73, 74, 76, 87, 91],
  },
  {
    pawns: [23, 25, 9, 12, 6, 48],
    walls: [7, 10, 12, 14, 15, 17, 22, 24, 25, 32, 35, 36, 45, 52, 53, 60, 62, 66, 68, 70, 73, 74, 81, 95],
  },
];

export const WALL_DIRECTIONS = ['위', '아래', '왼쪽', '오른쪽'] as const;
