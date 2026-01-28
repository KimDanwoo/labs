// Generator
export {
  generateSolution,
  generateBoard,
  generateKillerBoard,
  generateKillerCages,
} from "./generator";

// Validator
export {
  hasUniqueSolution,
  checkRowConflict,
  checkColConflict,
  checkBlockConflict,
  checkConflicts,
  isBoardComplete,
  isBoardCorrect,
  validateBaseGrid,
  isValidPlacement,
  isKillerRemovalValidLenient,
  isKillerRemovalValid,
  validateCages,
  validateAllCages,
  validateKillerCages,
  isKillerBoardComplete,
} from "./validator";

// Common
export {
  createEmptyGrid,
  createEmptyBoard,
  shuffleArray,
  createEmptyHighlights,
  formatTime,
} from "./common";

// Calculate
export { calculateNeighborScore } from "./calculate";

// Remove
export {
  removeRandomCellsWithStrategy,
  removeKillerCells,
  forceRemoveAdditionalCells,
} from "./remove";

// Transformer
export { applyTransformations } from "./transformer";

// Controls
export { getHint } from "./controls";

// Update
export {
  updateSingleCell,
  updateCellSelection,
  updateCellNotes,
  resetUserInputs,
  findEmptyCells,
  calculateHighlights,
  clearHighlights,
  canFillCell,
  updateCellValue,
  validateBoard,
  checkGameCompletion,
} from "./update";
