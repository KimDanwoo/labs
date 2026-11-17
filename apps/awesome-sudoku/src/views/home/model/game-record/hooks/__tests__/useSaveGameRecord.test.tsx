import { saveGameRecord } from '@entities/game/api/gameRecordService';
import { GAME_LEVEL, GAME_MODE } from '@entities/game/model/constants/game';
import { calculatePoint } from '@entities/game/model/services/scoreCalculator';
import { gameStore } from '@entities/game/model/store/gameStore';
import {
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  solutionAtom,
} from '@entities/game/model/store/primitives';
import type { Difficulty } from '@entities/game/model/types/game';
import { userAtom } from '@entities/session/model/store/authAtoms';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSaveGameRecord } from '../useSaveGameRecord';

vi.mock('@entities/game/api/gameRecordService', () => ({ saveGameRecord: vi.fn() }));

const saveGameRecordMock = vi.mocked(saveGameRecord);

const USER = { uid: 'user-1', email: null, displayName: '단우', photoURL: null, emailVerified: true };

interface GameSpec {
  difficulty: Difficulty;
  completionTime: number;
}

const FIRST_GAME: GameSpec = { difficulty: GAME_LEVEL.EASY, completionTime: 100 };
const SECOND_GAME: GameSpec = { difficulty: GAME_LEVEL.EXPERT, completionTime: 300 };

const pointOf = ({ difficulty, completionTime }: GameSpec) =>
  calculatePoint({ difficulty, gameMode: GAME_MODE.CLASSIC, completionTime }).totalPoint;

const startGame = ({ difficulty }: GameSpec) => {
  gameStore.set(solutionAtom, [[1]]);
  gameStore.set(difficultyAtom, difficulty);
  gameStore.set(currentTimeAtom, 0);
  gameStore.set(isSuccessAtom, false);
  gameStore.set(isRecordSavedAtom, false);
};

const winGame = ({ completionTime }: GameSpec) => {
  gameStore.set(currentTimeAtom, completionTime);
  gameStore.set(isSuccessAtom, true);
};

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={gameStore}>{children}</Provider>;

describe('useSaveGameRecord', () => {
  beforeEach(() => {
    saveGameRecordMock.mockReset();
    gameStore.set(userAtom, USER);
    gameStore.set(gameModeAtom, GAME_MODE.CLASSIC);
    startGame(FIRST_GAME);
  });

  it('같은 방문에서 두 번째로 이긴 판도 저장되고, 점수는 그 판의 것이다', async () => {
    saveGameRecordMock.mockResolvedValue('record-id');
    const { result } = renderHook(() => useSaveGameRecord(), { wrapper });

    act(() => winGame(FIRST_GAME));
    await waitFor(() => expect(gameStore.get(isRecordSavedAtom)).toBe(true));
    expect(result.current.pointResult?.totalPoint).toBe(pointOf(FIRST_GAME));

    act(() => startGame(SECOND_GAME));
    expect(result.current.pointResult).toBeNull();

    act(() => winGame(SECOND_GAME));
    await waitFor(() => expect(saveGameRecordMock).toHaveBeenCalledTimes(2));

    expect(result.current.pointResult?.totalPoint).toBe(pointOf(SECOND_GAME));
    expect(saveGameRecordMock.mock.calls[1]?.[0]).toMatchObject({
      difficulty: SECOND_GAME.difficulty,
      completionTime: SECOND_GAME.completionTime,
      point: pointOf(SECOND_GAME),
    });
  });

  it('저장이 끝나기 전에 새 판을 시작하면, 늦게 온 응답이 새 판을 저장된 것으로 표시하지 않는다', async () => {
    let finishSaving: (recordId: string) => void = () => undefined;
    saveGameRecordMock.mockReturnValue(new Promise((resolve) => (finishSaving = resolve)));
    renderHook(() => useSaveGameRecord(), { wrapper });

    act(() => winGame(FIRST_GAME));
    await waitFor(() => expect(saveGameRecordMock).toHaveBeenCalledTimes(1));

    act(() => startGame(SECOND_GAME));
    await act(async () => finishSaving('record-id'));

    expect(gameStore.get(isRecordSavedAtom)).toBe(false);
  });
});
