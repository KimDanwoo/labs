import { BLOCK_SIZE } from "./constants";
import { Grid } from "./types";

export const deepCopyGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

export const getBlockCoordinates = (row: number, col: number): [number, number] => [
  Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE,
  Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE,
];

export const getCenterDistance = (row: number, col: number): number => Math.abs(4 - row) + Math.abs(4 - col);

export const isCorner = (row: number, col: number): boolean => (row === 0 || row === 8) && (col === 0 || col === 8);

export const isEdge = (row: number, col: number): boolean => row === 0 || row === 8 || col === 0 || col === 8;

export const isCenter = (row: number, col: number): boolean => getCenterDistance(row, col) <= 2;
