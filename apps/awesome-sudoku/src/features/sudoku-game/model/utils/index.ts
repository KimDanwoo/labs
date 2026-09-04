// Generator
export { generateBoard, generateKillerBoard, generateKillerCages, generateSolution } from './generator';

// Solver
export { countSolutions, generateRandomSolution, gradePuzzle, hasUniqueSolution, solveLogically } from './solver';

// Validator
export {
  checkConflicts,
  isBoardComplete,
  isKillerBoardComplete,
  isValidSolution,
  markWrongValues,
  validateKillerCages,
} from './validator';

// Common
export { createEmptyBoard, createEmptyGrid, createEmptyHighlights, formatTime, shuffleArray } from './common';

// Update
export {
  calculateHighlights,
  canFillCell,
  checkGameCompletion,
  clearHighlights,
  resetUserInputs,
  updateCellNotes,
  updateCellSelection,
  updateCellValue,
  updateSingleCell,
  validateBoard,
} from './update';
