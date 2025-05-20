import {
  checkConflicts,
  Difficulty,
  Grid,
  GRID_SIZE,
  GridPosition,
  KILLER_DIFFICULTY_RANGES,
  KillerCage,
  shuffleArray,
  SudokuBoard,
} from "@entities/sudoku/model";

/**
 * @description 인접한 셀 그룹화
 * @param {GridPosition[]} cells - 셀 목록
 * @returns {GridPosition[][]} 그룹화된 셀 목록
 */
export function groupAdjacentCells(cells: GridPosition[]): GridPosition[][] {
  const groups: GridPosition[][] = [];
  const visited = new Set<string>();

  for (const cell of cells) {
    const key = `${cell[0]}-${cell[1]}`;
    if (visited.has(key)) continue;

    // 새 그룹 시작
    const group: GridPosition[] = [cell];
    visited.add(key);

    // BFS로 인접 셀 찾기
    let index = 0;
    while (index < group.length) {
      const [currentRow, currentCol] = group[index++];
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]; // 상하좌우

      for (const [dRow, dCol] of directions) {
        const adjRow = currentRow + dRow;
        const adjCol = currentCol + dCol;
        const adjKey = `${adjRow}-${adjCol}`;

        // 인접한 셀이 남은 셀 목록에 있고 아직 방문하지 않았는지
        if (!visited.has(adjKey) && cells.some(([r, c]) => r === adjRow && c === adjCol)) {
          group.push([adjRow, adjCol]);
          visited.add(adjKey);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * @description 남은 셀 처리 (최적화 버전)
 * @param {KillerCage[]} cages - 케이지 목록
 * @param {Set<string>} assignedCells - 할당된 셀 목록
 * @param {Grid} solution - 솔루션
 * @returns {void}
 */
export function handleRemainingCells(cages: KillerCage[], assignedCells: Set<string>, solution: Grid): void {
  // 누락된 셀 목록
  const missingCells: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row}-${col}`;
      if (!assignedCells.has(key)) {
        missingCells.push([row, col]);
      }
    }
  }

  // 누락된 셀이 없으면 종료
  if (missingCells.length === 0) return;

  // 효율적인 케이지 확장 함수 (클로저 패턴으로 메모리 최적화)
  const processRemainingCells = () => {
    // 각 케이지의 셀 맵 (빠른 조회용)
    const cageCellMaps: Set<string>[] = cages.map((cage) => new Set(cage.cells.map(([r, c]) => `${r}-${c}`)));

    // 인접 케이지 찾기 (메모이제이션으로 계산 줄이기)
    const getAdjacentCages = (row: number, col: number): number[] => {
      const adjacentCages: number[] = [];
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]; // 상하좌우

      for (let i = 0; i < cages.length; i++) {
        for (const [dRow, dCol] of directions) {
          const adjRow = row + dRow;
          const adjCol = col + dCol;
          const adjKey = `${adjRow}-${adjCol}`;

          if (cageCellMaps[i].has(adjKey)) {
            adjacentCages.push(i);
            break; // 이 케이지는 이미 인접한 것으로 확인됨
          }
        }
      }

      return adjacentCages;
    };

    // 첫 번째 전략: 인접한 케이지 확장
    for (const [row, col] of missingCells) {
      const key = `${row}-${col}`;
      if (assignedCells.has(key)) continue;

      const adjacentCageIndices = getAdjacentCages(row, col);

      if (adjacentCageIndices.length > 0) {
        // 인접 케이지 중 가장 작은 것 선택 (균형 맞추기)
        adjacentCageIndices.sort((a, b) => cages[a].cells.length - cages[b].cells.length);
        const targetCageIndex = adjacentCageIndices[0];

        // 케이지에 셀 추가
        cages[targetCageIndex].cells.push([row, col]);
        cages[targetCageIndex].sum += solution[row][col];
        assignedCells.add(key);
        cageCellMaps[targetCageIndex].add(key);
      }
    }

    // 두 번째 전략: 남은 셀로 새 케이지 형성
    // 남은 셀끼리 그룹화
    const remainingCells = missingCells.filter(([r, c]) => !assignedCells.has(`${r}-${c}`));

    if (remainingCells.length >= 2) {
      // 인접한 셀끼리 그룹화
      const grouped = groupAdjacentCells(remainingCells);

      // 각 그룹을 별도의 케이지로 만들기
      for (const group of grouped) {
        if (group.length >= 2) {
          // 최소 2개 이상의 셀 필요
          const newCage: KillerCage = {
            cells: group,
            sum: group.reduce((sum, [r, c]) => sum + solution[r][c], 0),
            id: cages.length + 1,
          };

          cages.push(newCage);
          for (const [r, c] of group) {
            assignedCells.add(`${r}-${c}`);
          }
        }
      }
    }

    // 세 번째 전략: 남은 고립된 셀 처리
    // 가장 가까운 케이지에 강제 추가
    const finalRemainingCells = missingCells.filter(([r, c]) => !assignedCells.has(`${r}-${c}`));

    for (const [row, col] of finalRemainingCells) {
      let nearestCage = 0;
      let minDistance = Infinity;

      // 가장 가까운 케이지 찾기
      for (let i = 0; i < cages.length; i++) {
        for (const [cageRow, cageCol] of cages[i].cells) {
          const distance = Math.abs(row - cageRow) + Math.abs(col - cageCol);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCage = i;
          }
        }
      }

      // 가장 가까운 케이지에 추가
      cages[nearestCage].cells.push([row, col]);
      cages[nearestCage].sum += solution[row][col];
      assignedCells.add(`${row}-${col}`);
    }
  };

  processRemainingCells();
}

/**
 * @description 킬러 스도쿠 모드 케이지 생성 (1개짜리 케이지 지원 버전)
 * @param {Grid} solution - 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {KillerCage[]} 생성된 케이지 목록
 */
export function generateKillerCages(solution: Grid, difficulty: Difficulty): KillerCage[] {
  const cages: KillerCage[] = [];
  const assignedCells = new Set<string>();
  let cageId = 1;

  // 난이도에 따른 케이지 크기 제한
  const { maxCageSize } = KILLER_DIFFICULTY_RANGES[difficulty];
  const minCageSize = 1; // 1개짜리 케이지 허용

  // 최대 단일 셀 케이지 수 제한
  const maxSingleCellCages = 3; // 최대 3개의 단일 셀 케이지 허용
  let singleCellCageCount = 0;

  // 격자 순회를 위한 전략 선택
  // 대각선 패턴으로 시작 셀 선택 (더 자연스러운 케이지 분포)
  const cellOrder: GridPosition[] = [];

  // 주 대각선과 부 대각선을 먼저 추가
  for (let i = 0; i < GRID_SIZE; i++) {
    cellOrder.push([i, i]); // 주 대각선
    if (i !== GRID_SIZE - 1 - i) {
      cellOrder.push([i, GRID_SIZE - 1 - i]); // 부 대각선
    }
  }

  // 나머지 셀 추가 (약간의 무작위성 추가)
  const remainingCells: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const isDiagonal = row === col || row === GRID_SIZE - 1 - col;
      if (!isDiagonal) {
        remainingCells.push([row, col]);
      }
    }
  }
  shuffleArray(remainingCells);
  cellOrder.push(...remainingCells);

  // 단일 셀 케이지에 더 적합한 숫자 (예: 1, 5, 9)
  const isSuitableForSingleCell = (value: number): boolean => {
    return value === 1 || value === 5 || value === 9 || Math.random() < 0.1;
  };

  // 모든 셀을 처리
  for (const [startRow, startCol] of cellOrder) {
    const key = `${startRow}-${startCol}`;
    if (assignedCells.has(key)) continue;

    // 현재 값 가져오기
    const currentValue = solution[startRow][startCol];

    // 이 셀부터 새 케이지 시작
    const cage: KillerCage = {
      cells: [[startRow, startCol]],
      sum: currentValue,
      id: cageId,
    };
    assignedCells.add(key);

    // 사용된 숫자 추적 (중복 방지)
    const usedNumbers = new Set<number>([currentValue]);

    // 단일 셀 케이지 생성 결정
    // 적합한 숫자이고 최대 개수를 넘지 않으면 단일 셀 케이지 생성 확률 증가
    const createSingleCellCage =
      singleCellCageCount < maxSingleCellCages &&
      (isSuitableForSingleCell(currentValue) ? Math.random() < 0.7 : Math.random() < 0.15);

    // 목표 크기 설정
    const targetSize = createSingleCellCage
      ? 1 // 단일 셀 케이지
      : Math.min(2 + Math.floor(Math.random() * (maxCageSize - 2 + 1)), maxCageSize); // 2개 이상 케이지

    // 효율적인 확장 로직
    const expandCage = () => {
      // 단일 셀 케이지는 확장하지 않음
      if (targetSize === 1) return;

      // 현재 케이지 형태
      const currentShape = new Set<string>(cage.cells.map(([r, c]) => `${r}-${c}`));

      // BFS 패턴으로 확장 (메모리 효율적)
      let attempts = 0;
      const MAX_ATTEMPTS = 100; // 안전장치

      while (cage.cells.length < targetSize && attempts < MAX_ATTEMPTS) {
        attempts++;

        // 모든 인접 셀 찾기 (한 번만 계산)
        const adjacentOptions: Array<{
          pos: GridPosition;
          value: number;
          connections: number;
          numberFrequency: number;
        }> = [];

        for (const [cRow, cCol] of cage.cells) {
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]; // 상하좌우

          for (const [dRow, dCol] of directions) {
            const newRow = cRow + dRow;
            const newCol = cCol + dCol;

            // 유효 범위 확인
            if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
              const newKey = `${newRow}-${newCol}`;

              // 이미 처리된 셀이 아닌지 확인
              if (!assignedCells.has(newKey) && !currentShape.has(newKey)) {
                const value = solution[newRow][newCol];

                // 이 셀이 케이지 내 몇 개의 셀과 인접해 있는지 확인
                let connections = 0;
                for (const [checkDRow, checkDCol] of directions) {
                  const checkRow = newRow + checkDRow;
                  const checkCol = newCol + checkDCol;
                  const checkKey = `${checkRow}-${checkCol}`;

                  if (currentShape.has(checkKey)) {
                    connections++;
                  }
                }

                // 이 숫자가 현재 케이지에서 얼마나 자주 사용되는지 확인
                // (중복 숫자는 피하거나 최소화)
                const numberFrequency = usedNumbers.has(value) ? 1 : 0;

                adjacentOptions.push({
                  pos: [newRow, newCol],
                  value,
                  connections,
                  numberFrequency,
                });
              }
            }
          }
        }

        // 인접 셀이 없으면 중단
        if (adjacentOptions.length === 0) break;

        // 옵션 정렬 및 중복 제거
        const uniqueOptions = Array.from(
          new Map(adjacentOptions.map((opt) => [`${opt.pos[0]}-${opt.pos[1]}`, opt])).values(),
        );

        // 최적의 다음 셀 선택 전략:
        // 1. 중복 숫자 피하기 (numberFrequency가 낮은 것)
        // 2. 연결성 높이기 (connections가 높은 것)
        uniqueOptions.sort((a, b) => {
          // 최소 크기에 도달하지 못한 경우 연결성 우선
          if (cage.cells.length < minCageSize) {
            return b.connections - a.connections || a.numberFrequency - b.numberFrequency;
          }

          // 최소 크기 이상일 경우 중복 숫자 회피 우선
          return a.numberFrequency - b.numberFrequency || b.connections - a.connections;
        });

        // 최적 옵션 선택 (약간의 무작위성 추가)
        const bestOption =
          uniqueOptions.length > 0
            ? uniqueOptions[Math.floor(Math.random() * Math.min(3, uniqueOptions.length))]
            : null;

        if (bestOption) {
          const [newRow, newCol] = bestOption.pos;
          cage.cells.push([newRow, newCol]);
          cage.sum += bestOption.value;
          assignedCells.add(`${newRow}-${newCol}`);
          currentShape.add(`${newRow}-${newCol}`);
          usedNumbers.add(bestOption.value);
        } else {
          break;
        }
      }
    };

    // 케이지 확장 실행
    expandCage();

    // 유효한 케이지만 추가 (최소 크기 확인)
    if (cage.cells.length >= minCageSize) {
      // 단일 셀 케이지인 경우 카운터 증가
      if (cage.cells.length === 1) {
        singleCellCageCount++;
      }

      cages.push(cage);
      cageId++;
    } else {
      // 케이지가 너무 작으면 셀 할당 해제
      for (const [row, col] of cage.cells) {
        assignedCells.delete(`${row}-${col}`);
      }
    }
  }

  // 누락된 셀 처리
  if (assignedCells.size < GRID_SIZE * GRID_SIZE) {
    handleRemainingCells(cages, assignedCells, solution);

    // 모든 셀이 할당되었는지 최종 확인
    if (assignedCells.size < GRID_SIZE * GRID_SIZE) {
      console.warn(
        `킬러 스도쿠 생성 경고: ${GRID_SIZE * GRID_SIZE - assignedCells.size}개의 셀이 할당되지 않았습니다.`,
      );

      // 할당되지 않은 모든 셀을 찾아 마지막 케이지에 추가
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const key = `${row}-${col}`;
          if (!assignedCells.has(key) && cages.length > 0) {
            const lastCage = cages[cages.length - 1];
            lastCage.cells.push([row, col]);
            lastCage.sum += solution[row][col];
            assignedCells.add(key);
          }
        }
      }
    }
  }

  return cages;
}
/**
 * @description 케이지 내 숫자 합계 및 중복 검증
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {SudokuBoard} 케이지 검증 상태가 업데이트된 보드
 */
export function validateKillerCages(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  const newBoard = structuredClone(board);
  const cageConflicts = new Map<number, boolean>();

  // 먼저 모든 셀의 케이지 관련 충돌 플래그를 초기화
  // 일반 스도쿠 규칙(행, 열, 블록)에 의한 충돌은 유지
  for (const cage of cages) {
    for (const [row, col] of cage.cells) {
      // 일반 규칙 충돌 상태 임시 저장
      const hasStandardConflict = newBoard[row][col].isConflict;
      // 충돌 상태 초기화 (케이지 검증 전)
      newBoard[row][col].isConflict = hasStandardConflict;
    }
  }

  // 각 케이지 검증
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;
    let isConflict = false;

    // 케이지 내 모든 셀 순회
    for (const [row, col] of cage.cells) {
      const value = newBoard[row][col].value;

      // 빈 셀이 있는 경우
      if (value === null) {
        allFilled = false;
        continue;
      }

      // 합계 계산
      sum += value;

      // 케이지 내 중복 숫자 검사
      if (usedNumbers.has(value)) {
        isConflict = true;
      }

      usedNumbers.add(value);
    }

    // 케이지가 모두 채워졌고 합이 맞지 않는 경우
    if (allFilled && sum !== cage.sum) {
      isConflict = true;
    }

    // 합이 이미 케이지 합을 초과하는 경우도 충돌로 처리
    if (sum > cage.sum) {
      isConflict = true;
    }

    cageConflicts.set(cage.id, isConflict);
  }

  // 보드에 케이지 충돌 상태 반영
  for (const cage of cages) {
    // 유효한 ID 확인
    if (cage.id === undefined || !cageConflicts.has(cage.id)) {
      console.warn(`케이지 ID ${cage.id}가 존재하지 않습니다.`);
      continue;
    }

    const hasConflictNext = cageConflicts.get(cage.id) || false;

    if (hasConflictNext) {
      // 케이지 내 모든 셀에 충돌 표시
      for (const [row, col] of cage.cells) {
        // 범위 검사 추가
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
          console.warn(`유효하지 않은 셀 위치: [${row}, ${col}]`);
          continue;
        }

        if (newBoard[row][col].value !== null) {
          newBoard[row][col].isConflict = true;
        }
      }
    }
  }

  return newBoard;
}

/**
 * @description 킬러 스도쿠 모드의 보드 충돌 확인 (일반 규칙 + 케이지 규칙)
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {SudokuBoard} 충돌 상태가 업데이트된 보드
 */
export function checkKillerConflicts(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  // 1. 일반 스도쿠 규칙 검사 (행, 열, 블록)
  let newBoard = checkConflicts(board);

  // 2. 킬러 스도쿠 케이지 규칙 검사
  newBoard = validateKillerCages(newBoard, cages);

  return newBoard;
}

/**
 * @description 킬러 스도쿠 보드가 완성되었는지 확인
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {boolean} 완성 여부
 */
export function isKillerBoardComplete(board: SudokuBoard, cages: KillerCage[]): boolean {
  // 1. 일반 스도쿠 규칙 확인 (모든 셀이 채워져 있고 충돌이 없는지)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }

  // 2. 킬러 스도쿠 케이지 규칙 확인
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();

    // 케이지 내 모든 셀 검사
    for (const [row, col] of cage.cells) {
      const value = board[row][col].value;
      if (value === null) {
        return false;
      }

      // 합계 계산
      sum += value;

      // 케이지 내 중복 숫자 확인
      if (usedNumbers.has(value)) {
        return false;
      }

      usedNumbers.add(value);
    }

    // 케이지 합이 정확히 일치하는지 확인
    if (sum !== cage.sum) {
      return false;
    }
  }

  return true; // 모든 조건 충족
}
