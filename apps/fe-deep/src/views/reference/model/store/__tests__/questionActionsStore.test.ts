import { getProgressForQuestion } from '@entities/progress';
import { toggleBookmark } from '@features/bookmark';
import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { getSnapshot, isMasteredStatus, markQuestionLearned, subscribe } from '../questionActionsStore';

const BROWSER_GLOBALS = ['window', 'localStorage'];
const previous = BROWSER_GLOBALS.map((name) => ({
  name,
  descriptor: Object.getOwnPropertyDescriptor(globalThis, name),
}));
const storage = new Map<string, string>();
const noop = () => undefined;

before(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});

after(() => {
  for (const { name, descriptor } of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

beforeEach(() => storage.clear());

test('보는 컴포넌트가 있는 동안에는 같은 스냅샷을 돌려준다', () => {
  const leave = subscribe('q-stable', noop);
  assert.equal(getSnapshot('q-stable'), getSnapshot('q-stable'));
  leave();
});

test('다른 화면에서 북마크를 바꾸고 돌아오면 바뀐 값을 다시 읽는다', () => {
  const leave = subscribe('q-bookmark', noop);
  assert.equal(getSnapshot('q-bookmark').isBookmarked, false);
  leave();

  toggleBookmark('q-bookmark');

  const leaveAgain = subscribe('q-bookmark', noop);
  assert.equal(getSnapshot('q-bookmark').isBookmarked, true);
  leaveAgain();
});

test('완료로 표시한 질문은 한 번만 눌러도 저장소에 완료로 남아, 다른 화면에 다녀와도 완료로 보인다', () => {
  const leave = subscribe('q-learned', noop);
  markQuestionLearned('q-learned');
  leave();

  assert.equal(getProgressForQuestion('q-learned')?.status, 'mastered');

  const leaveAgain = subscribe('q-learned', noop);
  assert.equal(isMasteredStatus(getSnapshot('q-learned').status), true);
  leaveAgain();
});
