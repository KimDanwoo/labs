/* eslint-disable no-console */

import { BASE_GRID, BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { DIFFICULTY_RANGES, GAME_LEVEL, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  applyTransformations,
  generateKillerCages,
  hasUniqueSolution,
  shuffleArray,
} from "@features/game-board/model/utils";

/**
 * 유효한 스도쿠 솔루션 생성
 * @returns {Grid} 완성된 스도쿠 그리드
 */
export function generateSolution(): Grid {
  const solution = structuredClone(BASE_GRID);

  applyTransformations(solution);

  return solution;
}

/**
 * @description 완성된 솔루션으로부터 초기 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @returns {SudokuBoard} 초기 보드
 */
export function createInitialBoard(solution: Grid): SudokuBoard {
  return Array.from({ length: BOARD_SIZE }, (_1, row) =>
    Array.from({ length: BOARD_SIZE }, (_2, col) => ({
      value: solution[row][col],
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
}

/**
 * @description 개선된 스도쿠 보드 생성 함수
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도 설정
 * @returns {SudokuBoard} 생성된 스도쿠 보드
 */
export const generateBoard = (solution: Grid, difficulty: Difficulty): SudokuBoard => {
  // 솔루션으로부터 초기 보드 생성
  const board = createInitialBoard(solution);

  // 난이도에 따라 제거할 셀 수 계산
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const cellsToRemove = min + Math.floor(Math.random() * (max - min + 1));

  console.log(`일반 스도쿠: 난이도 ${difficulty}, 제거할 셀 수: ${cellsToRemove}, 남길 힌트 수: ${81 - cellsToRemove}`);

  // 개선된 셀 제거 알고리즘 적용
  removeRandomCellsImproved(board, solution, cellsToRemove);

  // 최종 힌트 수 확인
  let actualHintCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== null) {
        actualHintCount++;
      }
    }
  }

  console.log(`일반 스도쿠: 최종 힌트 수: ${actualHintCount}`);

  return board;
};

/**
 * @description 킬러 스도쿠 모드 게임 보드 생성 (개선된 함수)
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {{ board: SudokuBoard, cages: KillerCage[] }} 생성된 킬러 스도쿠 보드
 */
export function generateKillerBoard(
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } {
  // 기본 보드 생성
  const board = createInitialBoard(solution);

  // 케이지 생성 (중복 숫자 방지 로직 포함)
  const cages = generateKillerCages(solution, difficulty);

  // 케이지 유효성 검증
  const isValidCages = validateCages(cages, solution);
  if (!isValidCages) {
    console.error("케이지 생성 실패: 중복 숫자 발견");
    // 재시도 로직 또는 에러 처리
    throw new Error("킬러 스도쿠 케이지 생성에 실패했습니다.");
  }

  // 난이도에 따른 힌트 셀 수 설정
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];

  // 총 81개 셀 중 제거할 셀 수 계산
  const cellsToRemove = 81 - hintsKeep;

  console.log(`킬러 스도쿠: 난이도 ${difficulty}, 남길 힌트 수: ${hintsKeep}, 제거할 셀 수: ${cellsToRemove}`);

  // 힌트 개수가 0일 경우 모든 셀 제거 (expert 난이도)
  if (hintsKeep === 0) {
    console.log("전문가 난이도: 모든 셀 제거 시도");
    forceRemoveAllCells(board);
  }
  // 힌트 개수가 매우 적을 경우 (hard 난이도)
  else if (hintsKeep <= 4) {
    console.log("어려움 난이도: 대부분의 셀 제거 후 힌트 배치");
    forceRemoveMostCells(board, solution, cages, hintsKeep);
  }
  // 일반적인 경우 (medium, easy 난이도)
  else {
    // 킬러 스도쿠 전용 셀 제거 알고리즘 적용
    removeRandomCellsForKiller(board, solution, cellsToRemove, cages);
  }

  // 최종 힌트 수 확인 및 강제 조정
  let actualHintCount = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value !== null) {
        actualHintCount++;
      }
    }
  }

  // Expert 난이도인데 힌트가 있으면 강제로 모두 제거
  if (difficulty === GAME_LEVEL.EXPERT && actualHintCount > 0) {
    console.log(`전문가 난이도 강제 적용: ${actualHintCount}개 힌트 발견, 모두 제거합니다.`);
    forceRemoveAllCells(board);
    actualHintCount = 0;
  }

  // Hard 난이도인데 힌트가 너무 많으면 강제로 조정
  if (difficulty === GAME_LEVEL.HARD && actualHintCount > hintsKeep) {
    console.log(`어려움 난이도 강제 적용: ${actualHintCount}개 힌트 발견, ${hintsKeep}개로 조정합니다.`);
    adjustHintCount(board, solution, cages, hintsKeep);
    actualHintCount = hintsKeep;
  }

  console.log(`킬러 스도쿠: 최종 힌트 수: ${actualHintCount}`);

  // 최종 검증
  if (difficulty === GAME_LEVEL.EXPERT && actualHintCount !== 0) {
    console.error("전문가 난이도 적용 실패: 힌트를 모두 제거하지 못했습니다.");
  }

  return { board, cages };
}

function adjustHintCount(board: SudokuBoard, solution: Grid, cages: KillerCage[], targetHints: number): void {
  // 현재 힌트 셀 찾기
  const hintCells: GridPosition[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value !== null) {
        hintCells.push([r, c]);
      }
    }
  }

  // 힌트 개수가 목표보다 많으면 초과분 제거
  if (hintCells.length > targetHints) {
    // 제거할 힌트 수
    const hintsToRemove = hintCells.length - targetHints;

    // 힌트 셀 섞기 (무작위 순서로 제거)
    shuffleArray(hintCells);

    // 초과분 제거
    for (let i = 0; i < hintsToRemove; i++) {
      const [r, c] = hintCells[i];
      board[r][c].value = null;
      board[r][c].isInitial = false;
    }
  }
}

function forceRemoveAllCells(board: SudokuBoard): void {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c].value = null;
      board[r][c].isInitial = false;
    }
  }
}

// Hard 난이도를 위한 거의 모든 셀 강제 제거 함수 (최소 힌트 수만 유지)
function forceRemoveMostCells(board: SudokuBoard, solution: Grid, cages: KillerCage[], targetHints: number): void {
  // 1. 모든 셀 제거
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c].value = null;
      board[r][c].isInitial = false;
    }
  }

  // 2. 각 케이지별로 정보를 수집
  const cageInfoList = cages.map((cage) => {
    // 케이지 내 셀들의 점수 계산
    const cellScores = cage.cells.map(([r, c]) => {
      // 점수 계산 (낮을수록 힌트로 선택될 가능성 높음)
      let score = 0;

      // 각 셀 위치별 점수 부여
      // 중앙에 가까울수록 높은 점수 (힌트로 선택 가능성 낮음)
      const centerDistance = Math.abs(4 - r) + Math.abs(4 - c);
      score += Math.max(0, 3 - centerDistance) * 0.5;

      // 대각선 셀은 점수 높음 (힌트로 선택 가능성 낮음)
      if (r === c || r + c === 8) {
        score += 0.5;
      }

      // 같은 숫자가 행/열/블록에 많을수록 점수 높음
      const value = solution[r][c];
      let sameValueCount = 0;

      // 행/열에서 같은 숫자 개수
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (i !== c && solution[r][i] === value) sameValueCount++;
        if (i !== r && solution[i][c] === value) sameValueCount++;
      }

      // 블록에서 같은 숫자 개수
      const blockRow = Math.floor(r / BLOCK_SIZE) * BLOCK_SIZE;
      const blockCol = Math.floor(c / BLOCK_SIZE) * BLOCK_SIZE;
      for (let br = 0; br < BLOCK_SIZE; br++) {
        for (let bc = 0; bc < BLOCK_SIZE; bc++) {
          const cr = blockRow + br;
          const cc = blockCol + bc;
          if ((cr !== r || cc !== c) && solution[cr][cc] === value) {
            sameValueCount++;
          }
        }
      }

      score += sameValueCount * 0.2;

      // 무작위성 추가
      score += Math.random() * 0.5;

      return {
        position: [r, c] as GridPosition,
        value: solution[r][c],
        score,
      };
    });

    // 케이지 내 셀 점수 기준으로 정렬 (낮은 점수 = 힌트로 적합)
    cellScores.sort((a, b) => a.score - b.score);

    return {
      cage,
      cellScores,
    };
  });

  // 3. 전체 케이지를 힌트 배치 우선순위로 정렬
  // 작은 케이지가 더 중요하므로 먼저 처리
  cageInfoList.sort((a, b) => {
    // 케이지 크기 비교 (작은 것 우선)
    const sizeCompare = a.cage.cells.length - b.cage.cells.length;
    if (sizeCompare !== 0) return sizeCompare;

    // 크기가 같으면 케이지 합 비교 (작은 합 우선)
    return a.cage.sum - b.cage.sum;
  });

  // 4. 필수 힌트 배치 (targetHints 개수만큼)
  let hintsAdded = 0;

  // 먼저 각 케이지의 가장 중요한 셀을 후보로 추가
  const hintCandidates: { position: GridPosition; value: number; score: number }[] = [];

  for (const cageInfo of cageInfoList) {
    // 각 케이지에서 가장 점수가 낮은 셀 선택
    if (cageInfo.cellScores.length > 0) {
      hintCandidates.push(cageInfo.cellScores[0]);
    }
  }

  // 후보를 점수 순으로 정렬
  hintCandidates.sort((a, b) => a.score - b.score);

  // 필요한 힌트 수만큼 배치
  for (let i = 0; i < Math.min(targetHints, hintCandidates.length); i++) {
    const { position, value } = hintCandidates[i];
    const [r, c] = position;

    board[r][c].value = value;
    board[r][c].isInitial = true;
    hintsAdded++;
  }

  // 5. 힌트가 targetHints보다 적으면 추가 힌트 배치
  if (hintsAdded < targetHints) {
    // 모든 셀의 점수 계산
    const allCellScores: { position: GridPosition; value: number; score: number }[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].value === null) {
          // 아직 힌트가 아닌 셀만
          // 점수 계산 (낮을수록 힌트로 적합)
          let score = 0;

          // 중앙에서 멀수록 낮은 점수
          const centerDistance = Math.abs(4 - r) + Math.abs(4 - c);
          score += Math.max(0, 3 - centerDistance) * 0.5;

          // 무작위성 추가
          score += Math.random();

          allCellScores.push({
            position: [r, c] as GridPosition,
            value: solution[r][c],
            score,
          });
        }
      }
    }

    // 점수 순으로 정렬
    allCellScores.sort((a, b) => a.score - b.score);

    // 추가 힌트 배치
    for (let i = 0; i < targetHints - hintsAdded && i < allCellScores.length; i++) {
      const { position, value } = allCellScores[i];
      const [r, c] = position;

      board[r][c].value = value;
      board[r][c].isInitial = true;
    }
  }
}

/**
 * @description 케이지 유효성 검증 함수
 * @param {KillerCage[]} cages - 케이지 목록
 * @param {Grid} solution - 솔루션
 * @returns {boolean} 모든 케이지가 유효한지 여부
 */
function validateCages(cages: KillerCage[], solution: Grid): boolean {
  for (const cage of cages) {
    const values = cage.cells.map(([r, c]) => solution[r][c]);
    const uniqueValues = new Set(values);

    // 중복 숫자 검사
    if (values.length !== uniqueValues.size) {
      console.error(`케이지 ${cage.id}에 중복 숫자 발견:`, values);
      return false;
    }

    // 합계 검사
    const actualSum = values.reduce((sum, val) => sum + val, 0);
    if (actualSum !== cage.sum) {
      console.error(`케이지 ${cage.id}의 합이 맞지 않음: 계산값 ${actualSum}, 저장값 ${cage.sum}`);
      return false;
    }
  }

  return true;
}

/**
 * @description 킬러 스도쿠 전용 셀 제거 함수
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} targetRemoveCount - 제거할 셀 수
 * @param {KillerCage[]} cages - 케이지 목록
 */
function removeRandomCellsForKiller(
  board: SudokuBoard,
  solution: Grid,
  targetRemoveCount: number,
  cages: KillerCage[],
): void {
  // 케이지별로 셀을 그룹화
  const cageMap = new Map<string, KillerCage>();
  for (const cage of cages) {
    for (const [row, col] of cage.cells) {
      cageMap.set(`${row}-${col}`, cage);
    }
  }

  // 모든 위치를 배열로 만듦
  const allPositions: GridPosition[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      allPositions.push([row, col]);
    }
  }

  // 각 셀의 점수 계산 함수 (킬러 스도쿠 특화)
  const calculateCellScore = (row: number, col: number): number => {
    let score = 0;
    const cellKey = `${row}-${col}`;
    const cage = cageMap.get(cellKey);

    if (cage) {
      const cellValue = solution[row][col];

      // 케이지 내에서 유일한 숫자인지 확인
      const cageValues = cage.cells.map(([r, c]) => solution[r][c]);
      const sameValueCount = cageValues.filter((v) => v === cellValue).length;

      // 케이지 내에서 유일한 값이면 제거하기 어려움
      if (sameValueCount === 1) {
        score += 5;
      }

      // 작은 케이지에 있는 숫자는 제거하기 더 어려움
      if (cage.cells.length <= 2) {
        score += 4;
      } else if (cage.cells.length <= 3) {
        score += 2;
      }

      // 케이지의 합이 작을수록 제거하기 어려움
      if (cage.sum <= 10) {
        score += 3;
      } else if (cage.sum <= 15) {
        score += 1;
      }
    }

    // 기존 일반 스도쿠 점수도 포함
    const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
    score += Math.max(0, 3 - centerDistance) * 0.3;

    // 대각선 셀에 보너스
    if (row === col || row + col === 8) {
      score += 1;
    }

    // 약간의 무작위성 추가
    score += Math.random() * 0.5;

    return score;
  };

  // 각 셀에 점수 할당 및 정렬 (점수가 낮은 셀부터 제거 시도)
  const scoredPositions = allPositions.map(([row, col]) => ({
    position: [row, col] as GridPosition,
    score: calculateCellScore(row, col),
  }));

  // 제거 시도 순서: 점수가 낮은 셀(제거하기 쉬운 셀)부터 시도
  scoredPositions.sort((a, b) => a.score - b.score);

  // 임시 그리드 (유일 솔루션 검사용)
  const tempGrid: (number | null)[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    tempGrid[r] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      tempGrid[r][c] = board[r][c].value;
    }
  }

  let removedCount = 0;
  const maxRetries = 10; // 최대 재시도 횟수 증가
  let forcedKeepCount = 0; // 케이지당 유지해야 하는 힌트 수

  // 난이도에 따른 케이지당 유지해야 하는 최소 힌트 수 설정
  // 어려운 난이도일수록 더 적은 힌트 유지
  if (targetRemoveCount >= 75) {
    // Expert
    forcedKeepCount = 0;
  } else if (targetRemoveCount >= 65) {
    // Hard
    forcedKeepCount = 0;
  } else if (targetRemoveCount >= 55) {
    // Medium
    forcedKeepCount = 1;
  } else {
    // Easy
    forcedKeepCount = 1;
  }

  // 케이지별 필수 유지 셀 선택
  const forcedKeepCells = new Set<string>();
  if (forcedKeepCount > 0) {
    for (const cage of cages) {
      // 케이지 크기가 작으면 힌트를 더 적게 유지
      const actualKeepCount = Math.min(forcedKeepCount, Math.ceil(cage.cells.length / 3));

      if (actualKeepCount > 0) {
        // 케이지 셀 복사 및 섞기
        const cageCells = [...cage.cells];
        shuffleArray(cageCells);

        // 유지할 셀 선택
        for (let i = 0; i < actualKeepCount && i < cageCells.length; i++) {
          const [r, c] = cageCells[i];
          forcedKeepCells.add(`${r}-${c}`);
        }
      }
    }
  }

  for (let retry = 0; retry < maxRetries; retry++) {
    if (removedCount >= targetRemoveCount) break;

    // 재시도할 때마다 새로운 순서로 시도
    if (retry > 0) {
      // 점수에 무작위성 추가하여 다시 정렬
      scoredPositions.forEach((pos) => {
        pos.score = calculateCellScore(pos.position[0], pos.position[1]) + Math.random() * 2;
      });
      scoredPositions.sort((a, b) => a.score - b.score);
    }

    let successfulRemovalsInThisRetry = 0;

    // 모든 위치 시도
    for (const { position } of scoredPositions) {
      if (removedCount >= targetRemoveCount) break;

      const [row, col] = position;
      const cellKey = `${row}-${col}`;

      // 이미 제거된 셀이나 필수 유지 셀은 건너뜀
      if (board[row][col].value === null || forcedKeepCells.has(cellKey)) {
        continue;
      }

      // 케이지 내에서 마지막 힌트 셀인지 확인
      const cage = cageMap.get(cellKey);
      if (cage && forcedKeepCount === 0) {
        const cageHintCount = cage.cells.filter(([r, c]) => board[r][c].value !== null).length;
        // 모든 힌트를 제거해도 될 경우 (Expert 난이도)
        if (cageHintCount <= 1 && Math.random() < 0.8) {
          continue; // 80% 확률로 마지막 힌트는 유지
        }
      }

      // 원래 값 저장
      const originalValue = board[row][col].value;

      // 셀 임시 제거
      board[row][col].value = null;
      board[row][col].isInitial = false;
      tempGrid[row][col] = null;

      // 유일 솔루션 검사
      if (hasUniqueSolution(tempGrid)) {
        // 제거 성공
        removedCount++;
        successfulRemovalsInThisRetry++;
      } else {
        // 제거 실패 - 복원
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;
      }
    }

    // 이번 회차에서 제거된 셀이 없으면 더 이상 시도하지 않음
    if (successfulRemovalsInThisRetry === 0) {
      break;
    }
  }

  // 마지막 시도: 아직 목표에 도달하지 못했다면, 강제로 더 제거
  if (removedCount < targetRemoveCount && forcedKeepCount === 0) {
    // 남은 초기 셀들을 무작위로 섞음
    const remainingInitialCells: GridPosition[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].value !== null && board[r][c].isInitial) {
          remainingInitialCells.push([r, c]);
        }
      }
    }

    shuffleArray(remainingInitialCells);

    // 무작위 순서로 제거 시도
    for (const [row, col] of remainingInitialCells) {
      if (removedCount >= targetRemoveCount) break;

      const cellKey = `${row}-${col}`;

      // 필수 유지 셀은 건너뜀
      if (forcedKeepCells.has(cellKey)) {
        continue;
      }

      const originalValue = board[row][col].value;
      board[row][col].value = null;
      board[row][col].isInitial = false;
      tempGrid[row][col] = null;

      if (hasUniqueSolution(tempGrid)) {
        removedCount++;
      } else {
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;
      }
    }
  }

  // 최종 결과 로깅
  const finalHints = 81 - removedCount;
  console.log(
    `킬러 스도쿠: 목표 제거 수: ${targetRemoveCount}, 실제 제거 수: ${removedCount}, 최종 힌트 수: ${finalHints}`,
  );

  if (removedCount < targetRemoveCount * 0.9) {
    console.warn(`킬러 스도쿠: 목표로 한 ${targetRemoveCount}개 셀 제거 중 ${removedCount}개만 제거 가능했습니다.`);
  }
}

/**
 * @description 개선된 무작위 셀 제거 함수
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} targetRemoveCount - 제거할 셀 수
 * @param {KillerCage[]} cages - 케이지 목록 (킬러 스도쿠에만 사용)
 */
function removeRandomCellsImproved(
  board: SudokuBoard,
  solution: Grid,
  targetRemoveCount: number,
  cages?: KillerCage[],
): void {
  // 킬러 스도쿠인 경우 전용 함수 사용
  if (cages) {
    removeRandomCellsForKiller(board, solution, targetRemoveCount, cages);
    return;
  }

  // 모든 위치를 배열로 만듦
  const allPositions: GridPosition[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      allPositions.push([row, col]);
    }
  }

  // 각 셀의 점수 계산 함수 (낮을수록 제거하기 쉬운 셀)
  const calculateCellScore = (row: number, col: number): number => {
    let score = 0;

    // 중앙 셀에 보너스 (더 많은 제약 조건)
    const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
    score += Math.max(0, 3 - centerDistance) * 0.5; // 중앙에 가까울수록 높은 점수

    // 대각선 셀에 보너스
    if (row === col || row + col === 8) {
      score += 1;
    }

    // 같은 숫자가 행, 열, 블록에 많을수록 보너스
    const value = solution[row][col];
    let sameValueCount = 0;

    // 같은 행, 열에서 동일한 숫자 개수 확인
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (i !== col && solution[row][i] === value) sameValueCount++;
      if (i !== row && solution[i][col] === value) sameValueCount++;
    }

    // 같은 블록에서 동일한 숫자 개수 확인
    const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
    const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;
    for (let r = 0; r < BLOCK_SIZE; r++) {
      for (let c = 0; c < BLOCK_SIZE; c++) {
        const cr = blockRow + r;
        const cc = blockCol + c;
        if ((cr !== row || cc !== col) && solution[cr][cc] === value) {
          sameValueCount++;
        }
      }
    }

    score += sameValueCount * 0.2; // 같은 숫자가 많을수록 약간의 보너스

    // 약간의 무작위성 추가
    score += Math.random() * 0.5;

    return score;
  };

  // 각 셀에 점수 할당 및 정렬 (점수가 낮은 셀부터 제거 시도)
  const scoredPositions = allPositions.map(([row, col]) => ({
    position: [row, col] as GridPosition,
    score: calculateCellScore(row, col),
  }));

  // 제거 시도 순서: 점수가 낮은 셀(제거하기 쉬운 셀)부터 시도
  scoredPositions.sort((a, b) => a.score - b.score);

  // 임시 그리드 (유일 솔루션 검사용)
  const tempGrid: (number | null)[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    tempGrid[r] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      tempGrid[r][c] = board[r][c].value;
    }
  }

  let removedCount = 0;
  const maxRetries = 5; // 최대 재시도 횟수 증가
  let successfulRemovalsInThisRetry = 0;

  for (let retry = 0; retry < maxRetries; retry++) {
    if (removedCount >= targetRemoveCount) break;

    // 재시도할 때마다 새로운 순서로 시도
    if (retry > 0) {
      // 점수에 무작위성 추가하여 다시 정렬 (다양한 시도를 위해)
      scoredPositions.forEach((pos) => {
        pos.score = calculateCellScore(pos.position[0], pos.position[1]) + Math.random() * 2;
      });
      scoredPositions.sort((a, b) => a.score - b.score);
    }

    successfulRemovalsInThisRetry = 0;

    // 모든 위치 시도
    for (const { position } of scoredPositions) {
      if (removedCount >= targetRemoveCount) break;

      const [row, col] = position;

      // 이미 제거된 셀은 건너뜀
      if (board[row][col].value === null) {
        continue;
      }

      // 원래 값 저장
      const originalValue = board[row][col].value;

      // 셀 임시 제거
      board[row][col].value = null;
      board[row][col].isInitial = false;
      tempGrid[row][col] = null;

      // 유일 솔루션 검사
      if (hasUniqueSolution(tempGrid)) {
        // 제거 성공
        removedCount++;
        successfulRemovalsInThisRetry++;
      } else {
        // 제거 실패 - 복원
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;
      }
    }

    // 이번 회차에서 제거된 셀이 없으면 더 이상 시도하지 않음
    if (successfulRemovalsInThisRetry === 0) {
      break;
    }
  }

  // 마지막 기회: 무작위 순서로 다시 시도
  if (removedCount < targetRemoveCount) {
    // 남은 초기 셀들을 무작위로 섞음
    const remainingInitialCells: GridPosition[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].value !== null && board[r][c].isInitial) {
          remainingInitialCells.push([r, c]);
        }
      }
    }

    shuffleArray(remainingInitialCells);

    // 무작위 순서로 제거 시도
    for (const [row, col] of remainingInitialCells) {
      if (removedCount >= targetRemoveCount) break;

      const originalValue = board[row][col].value;
      board[row][col].value = null;
      board[row][col].isInitial = false;
      tempGrid[row][col] = null;

      if (hasUniqueSolution(tempGrid)) {
        removedCount++;
      } else {
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;
      }
    }
  }

  // 최종 결과 로깅
  const finalHints = 81 - removedCount;
  console.log(
    `일반 스도쿠: 목표 제거 수: ${targetRemoveCount}, 실제 제거 수: ${removedCount}, 최종 힌트 수: ${finalHints}`,
  );

  // 목표 달성 실패 경고
  if (removedCount < targetRemoveCount * 0.9) {
    // 목표의 90% 미만일 경우 경고
    console.warn(`목표로 한 ${targetRemoveCount}개 셀 제거 중 ${removedCount}개만 제거 가능했습니다.`);
  }
}

/**
 * @description 힌트 제공 - 무작위 빈 셀에 정답 채우기
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {Grid} solution - 정답 그리드
 * @returns {GridPosition & { value: number }} 힌트 정보
 */
export function getHint(board: SudokuBoard, solution: Grid): { row: number; col: number; value: number } | null {
  const emptyCells: GridPosition[] = [];

  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value === null) {
        emptyCells.push([rowIdx, colIdx]);
      }
    });
  });

  if (emptyCells.length === 0) return null; // 빈 셀이 없으면 null 반환

  // 무작위 빈 셀 선택
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [row, col] = emptyCells[randomIndex];

  return {
    row,
    col,
    value: solution[row][col],
  };
}
