import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-awesome-sudoku';
const RECORDS = 'gameRecords';
const PLAYER_ID = 'player';
const OTHER_PLAYER_ID = 'other-player';
const GOOGLE_PHOTO_URL = 'https://lh3.googleusercontent.com/a/photo';

let testEnv: RulesTestEnvironment;

function validRecord(): Record<string, unknown> {
  return {
    userId: PLAYER_ID,
    userDisplayName: '플레이어',
    userPhotoURL: GOOGLE_PHOTO_URL,
    gameMode: 'classic',
    difficulty: 'medium',
    completionTime: 420,
    hintsUsed: 1,
    mistakesCount: 2,
    score: 5.2,
    point: 5.2,
    isSuccess: true,
    createdAt: serverTimestamp(),
  };
}

function playerRecords() {
  return collection(testEnv.authenticatedContext(PLAYER_ID).firestore(), RECORDS);
}

function withoutField(field: string): Record<string, unknown> {
  const record = validRecord();
  delete record[field];
  return record;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('gameRecords 생성', () => {
  it.each([
    ['정상 기록', {}],
    ['사진이 없는 계정', { userPhotoURL: null }],
    ['킬러 모드 최저점', { gameMode: 'killer', difficulty: 'easy', score: 1, point: 1 }],
    ['전문가 최고점', { difficulty: 'expert', score: 12, point: 12 }],
  ])('%s: 저장된다', async (_, overrides) => {
    await assertSucceeds(addDoc(playerRecords(), { ...validRecord(), ...overrides }));
  });

  it.each([
    ['범위를 넘는 점수', { score: 99999, point: 99999 }],
    ['난이도 최저점보다 낮은 점수', { difficulty: 'hard', score: 3, point: 3 }],
    ['score와 다른 point', { point: 4 }],
    ['다른 사람 ID', { userId: OTHER_PLAYER_ID }],
    ['클라이언트 시각', { createdAt: Timestamp.fromMillis(0) }],
    ['구글이 아닌 사진 주소', { userPhotoURL: 'https://example.com/tracker.png' }],
    ['없는 난이도', { difficulty: 'impossible' }],
    ['없는 게임 모드', { gameMode: 'speedrun' }],
    ['힌트 초과', { hintsUsed: 4 }],
    ['실수 초과', { mistakesCount: 6 }],
    ['0초 완료', { completionTime: 0 }],
    ['소수 완료 시간', { completionTime: 1.5 }],
    ['빈 닉네임', { userDisplayName: '' }],
    ['실패한 게임', { isSuccess: false }],
    ['허용하지 않은 필드', { isAdmin: true }],
  ])('%s: 거부된다', async (_, overrides) => {
    await assertFails(addDoc(playerRecords(), { ...validRecord(), ...overrides }));
  });

  it('필드가 빠진 기록은 거부된다', async () => {
    await assertFails(addDoc(playerRecords(), withoutField('hintsUsed')));
  });

  it('로그인하지 않으면 거부된다', async () => {
    const anonymous = collection(testEnv.unauthenticatedContext().firestore(), RECORDS);
    await assertFails(addDoc(anonymous, validRecord()));
  });
});

describe('gameRecords 조회·변경', () => {
  const RECORD_ID = 'saved-record';

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), RECORDS, RECORD_ID), { ...validRecord(), createdAt: Timestamp.now() });
    });
  });

  it('로그인하지 않아도 랭킹을 읽을 수 있다', async () => {
    await assertSucceeds(getDocs(collection(testEnv.unauthenticatedContext().firestore(), RECORDS)));
  });

  it('본인 기록도 수정할 수 없다', async () => {
    await assertFails(updateDoc(doc(playerRecords(), RECORD_ID), { score: 6 }));
  });

  it('본인 기록도 삭제할 수 없다', async () => {
    await assertFails(deleteDoc(doc(playerRecords(), RECORD_ID)));
  });
});

describe('그 밖의 컬렉션', () => {
  it.each(['stardokuScores', 'users'])('%s: 쓸 수 없다', async (name) => {
    const db = testEnv.authenticatedContext(PLAYER_ID).firestore();
    await assertFails(setDoc(doc(db, name, PLAYER_ID), { score: 1 }));
  });
});
