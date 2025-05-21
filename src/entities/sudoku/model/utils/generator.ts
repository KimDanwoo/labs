import { BASE_GRID, DIFFICULTY_RANGES, GRID_SIZE, KILLER_DIFFICULTY_RANGES } from "@entities/sudoku/model/constants";
import { Difficulty, Grid, GridPosition, KillerCage, SudokuBoard } from "@entities/sudoku/model/types";
import {
  applyTransformations,
  generateKillerCages,
  hasUniqueSolution,
  shuffleArray,
} from "@entities/sudoku/model/utils";

/**
 * 유효한 스도쿠 솔루션 생성
 * @returns {Grid} 완성된 스도쿠 그리드
 */
export function generateSolution(): Grid {
  // 솔루션 복제
  const solution = structuredClone(BASE_GRID);

  // 변환 파이프라인 적용
  applyTransformations(solution);

  return solution;
}

/**
 * @description 완성된 솔루션으로부터 초기 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @returns {SudokuBoard} 초기 보드
 */
export function createInitialBoard(solution: Grid): SudokuBoard {
  return Array.from({ length: GRID_SIZE }, (_1, row) =>
    Array.from({ length: GRID_SIZE }, (_2, col) => ({
      value: solution[row][col],
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
}

/**
 * @description 무작위 셀 제거 (난이도 설정)
 * @description 유일 솔루션을 보장하기 위한 알고리즘
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} count - 제거할 셀 수
 */
const removeRandomCells = (board: SudokuBoard, solution: Grid, count: number): void => {
  // 모든 위치를 배열로 만듦
  const allPositions: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      allPositions.push([row, col]);
    }
  }

  // 전략적인 셀 제거를 위한 점수 부여 함수
  const calculateCellScore = (row: number, col: number): number => {
    // 중앙 셀은 더 많은 제약을 가지므로 제거 시 어려워짐
    const centerBonus = Math.abs(4 - row) + Math.abs(4 - col) <= 2 ? 3 : 0;

    // 대각선 셀은 제거 시 어려워짐
    const diagonalBonus = row === col || row + col === 8 ? 2 : 0;

    // 동일한 숫자가 많은 셀은 제거 시 어려워짐
    const value = solution[row][col];
    let sameValueCount = 0;

    // 같은 행, 열, 블록에서 동일한 숫자 개수 확인
    for (let i = 0; i < 9; i++) {
      if (solution[row][i] === value) sameValueCount++;
      if (solution[i][col] === value) sameValueCount++;
    }

    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (solution[blockRow + r][blockCol + c] === value) {
          sameValueCount++;
        }
      }
    }

    // 랜덤 요소 추가 (0-1 사이의 값)
    const randomBonus = Math.random();

    return centerBonus + diagonalBonus + sameValueCount / 10 + randomBonus;
  };

  // 난이도에 따른 제거 전략 선택
  let sortedPositions: GridPosition[];
  if (count < 45) {
    // 쉬운 난이도: 랜덤하게 섞기
    shuffleArray(allPositions);
    sortedPositions = allPositions;
  } else {
    // 어려운 난이도: 전략적으로 정렬
    sortedPositions = [...allPositions].sort((a, b) => {
      const scoreA = calculateCellScore(a[0], a[1]);
      const scoreB = calculateCellScore(b[0], b[1]);
      return scoreB - scoreA; // 내림차순 정렬
    });
  }

  // 빠른 유일성 검사를 위한 임시 그리드
  const tempGrid: (number | null)[][] = board.map((row) => row.map((cell) => cell.value));

  // 배치 처리 최적화: 여러 셀을 한 번에 제거해보고 유일성 검사
  const batchSize = count < 45 ? 5 : 3; // 쉬운 난이도는 더 큰 배치
  let removed = 0;
  let posIndex = 0;

  while (removed < count && posIndex < sortedPositions.length) {
    const cellsToTry: GridPosition[] = [];
    const originalValues: (number | null)[] = [];

    // 배치로 처리할 셀 선택
    for (let i = 0; i < batchSize && posIndex < sortedPositions.length; i++) {
      const [row, col] = sortedPositions[posIndex++];
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue; // 범위 체크 추가
      if (board[row][col].value !== null) {
        cellsToTry.push([row, col]);
        originalValues.push(board[row][col].value);

        // 임시로 셀 제거
        board[row][col].value = null;
        board[row][col].isInitial = false;
        tempGrid[row][col] = null;
      }
    }

    // 배치에 셀이 없으면 다음으로
    if (cellsToTry.length === 0) continue;

    // 현재 배치로 유일 솔루션이 유지되는지 확인
    let hasUnique = hasUniqueSolution(tempGrid);

    if (!hasUnique) {
      // 유일 솔루션이 아니면, 한 번에 하나씩 셀을 복원하며 확인
      for (let i = 0; i < cellsToTry.length; i++) {
        const [row, col] = cellsToTry[i];
        const originalValue = originalValues[i];

        // 셀 복원
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;

        // 나머지 셀로 유일 솔루션 확인
        hasUnique = hasUniqueSolution(tempGrid);
        if (hasUnique) {
          removed += i; // 복원 전까지 성공적으로 제거된 셀 수
          break;
        }
      }

      // 모든 셀을 복원해도 유일 솔루션이 아니면, 모두 복원
      if (!hasUnique) {
        for (let i = 0; i < cellsToTry.length; i++) {
          const [row, col] = cellsToTry[i];
          if (board[row][col].value === null) {
            board[row][col].value = originalValues[i];
            board[row][col].isInitial = true;
            tempGrid[row][col] = originalValues[i];
          }
        }
      }
    } else {
      // 배치 제거가 성공하면 제거된 셀 수 카운트
      removed += cellsToTry.length;
    }

    // 목표 달성하면 중단
    if (removed >= count) break;
  }
};

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

  // 케이지 생성
  const cages = generateKillerCages(solution, difficulty);

  // 난이도에 따른 힌트 셀 수 설정
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];

  // 총 81개 셀 중 제거할 셀 수 계산
  const cellsToRemove = 81 - hintsKeep;

  console.log(`킬러 스도쿠: 난이도 ${difficulty}, 남길 힌트 수: ${hintsKeep}, 제거할 셀 수: ${cellsToRemove}`);

  // 개선된 셀 제거 알고리즘 적용
  removeRandomCellsImproved(board, solution, cellsToRemove, cages);

  // 최종 힌트 수 확인
  let actualHintCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== null) {
        actualHintCount++;
      }
    }
  }

  console.log(`킬러 스도쿠: 최종 힌트 수: ${actualHintCount}`);

  return { board, cages };
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
  // 모든 위치를 배열로 만듦
  const allPositions: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      allPositions.push([row, col]);
    }
  }

  // 각 셀의 점수 계산 함수 (낮을수록 제거하기 쉬운 셀)
  const calculateCellScore = (row: number, col: number): number => {
    let score = 0;

    // 1. 케이지 관련 점수 (킬러 스도쿠에서만)
    if (cages) {
      const cageOfCell = cages.find((cage) => cage.cells.some(([r, c]) => r === row && c === col));

      if (cageOfCell) {
        const cellValue = solution[row][col];

        // 케이지 내 유일한 숫자인지 확인
        const hasOtherSameValue = cageOfCell.cells.some(
          ([r, c]) => (r !== row || c !== col) && solution[r][c] === cellValue,
        );

        if (!hasOtherSameValue) {
          score += 4; // 케이지 내 유일한 값이면 제거하기 어려움
        }

        // 작은 케이지에 있는 숫자는 제거하기 더 어려움
        if (cageOfCell.cells.length <= 2) {
          score += 3;
        } else if (cageOfCell.cells.length <= 3) {
          score += 2;
        }
      }
    }

    // 2. 중앙 셀에 보너스 (더 많은 제약 조건)
    const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
    score += Math.max(0, 3 - centerDistance) * 0.5; // 중앙에 가까울수록 높은 점수

    // 3. 대각선 셀에 보너스
    if (row === col || row + col === 8) {
      score += 1;
    }

    // 4. 같은 숫자가 행, 열, 블록에 많을수록 보너스
    const value = solution[row][col];
    let sameValueCount = 0;

    // 같은 행, 열에서 동일한 숫자 개수 확인
    for (let i = 0; i < 9; i++) {
      if (i !== col && solution[row][i] === value) sameValueCount++;
      if (i !== row && solution[i][col] === value) sameValueCount++;
    }

    // 같은 블록에서 동일한 숫자 개수 확인
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cr = blockRow + r;
        const cc = blockCol + c;
        if ((cr !== row || cc !== col) && solution[cr][cc] === value) {
          sameValueCount++;
        }
      }
    }

    score += sameValueCount * 0.2; // 같은 숫자가 많을수록 약간의 보너스

    // 5. 약간의 무작위성 추가
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
  for (let r = 0; r < GRID_SIZE; r++) {
    tempGrid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
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
