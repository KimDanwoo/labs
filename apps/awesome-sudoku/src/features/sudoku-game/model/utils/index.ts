// Generator
export { generateBoard, generateKillerBoard, generateKillerCages, generateSolution } from './generator';

// Validator
export {
  checkBlockConflict,
  checkColConflict,
  checkConflicts,
  checkRowConflict,
  hasUniqueSolution,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  isKillerRemovalValid,
  isKillerRemovalValidLenient,
  isValidPlacement,
  validateAllCages,
  validateBaseGrid,
  validateCages,
  validateKillerCages,
} from './validator';

// Common
export { createEmptyBoard, createEmptyGrid, createEmptyHighlights, formatTime, shuffleArray } from './common';

// Calculate
export { calculateNeighborScore } from './calculate';

// Remove
export { removeKillerCells, removeRandomCellsWithStrategy } from './remove';

// Transformer
export { applyTransformations } from './transformer';

// Controls
export { getHint } from './controls';

// Update
export {
  calculateHighlights,
  canFillCell,
  checkGameCompletion,
  clearHighlights,
  findEmptyCells,
  resetUserInputs,
  updateCellNotes,
  updateCellSelection,
  updateCellValue,
  updateSingleCell,
  validateBoard,
} from './update';
