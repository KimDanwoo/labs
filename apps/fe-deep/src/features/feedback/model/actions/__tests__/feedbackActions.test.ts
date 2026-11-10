import { loadServerActions } from '@shared/lib/__tests__/loadServerActions';
import assert from 'node:assert/strict';
import test from 'node:test';

const ACTIONS_FILE = new URL('../feedbackActions.ts', import.meta.url);

test('feedback administration requires authorization before constructing a privileged DB client', async () => {
  const { exported, clientCount } = loadServerActions(ACTIONS_FILE);
  await assert.rejects(exported.getFeedbacks!('pending'), /관리자 권한/);
  await assert.rejects(exported.updateFeedbackStatus!('feedback-1', 'resolved'), /관리자 권한/);
  assert.equal(clientCount(), 0);
});
