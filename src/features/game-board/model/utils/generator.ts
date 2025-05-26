import { BASE_GRID, BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import { applyTransformations, generateKillerCages, hasUniqueSolution } from "@features/game-board/model/utils";

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

  // 킬러 스도쿠 전용 셀 제거 알고리즘 적용
  removeRandomCellsForKiller(board, solution, cellsToRemove, cages);

  // 최종 힌트 수 확인
  let actualHintCount = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value !== null) {
        actualHintCount++;
      }
    }
  }

  console.log(`킬러 스도쿠: 최종 힌트 수: ${actualHintCount}`);

  return { board, cages };
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
  const maxRetries = 3; // 최대 재시도 횟수

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

      // 이미 제거된 셀은 건너뜀
      if (board[row][col].value === null) {
        continue;
      }

      // 케이지 내에서 마지막 힌트 셀인지 확인
      const cellKey = `${row}-${col}`;
      const cage = cageMap.get(cellKey);
      if (cage) {
        const cageHintCount = cage.cells.filter(([r, c]) => board[r][c].value !== null).length;
        // 케이지에 최소 1개의 힌트는 남겨두기
        if (cageHintCount <= 1) {
          continue;
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

  if (removedCount < targetRemoveCount) {
    console.warn(`킬러 스도쿠: 목표로 한 ${targetRemoveCount}개 셀 제거 중 ${removedCount}개만 제거 가능했습니다.`);
  } else {
    console.log(`킬러 스도쿠: 성공적으로 ${removedCount}개 셀 제거 완료`);
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

  // 기존 일반 스도쿠 로직
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
  const maxRetries = 3; // 최대 재시도 횟수

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

  if (removedCount < targetRemoveCount) {
    console.warn(`목표로 한 ${targetRemoveCount}개 셀 제거 중 ${removedCount}개만 제거 가능했습니다.`);
  } else {
    console.log(`성공적으로 ${removedCount}개 셀 제거 완료`);
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
