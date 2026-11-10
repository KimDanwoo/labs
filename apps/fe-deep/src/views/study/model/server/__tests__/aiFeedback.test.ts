import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFeedbackInput } from '../aiFeedback';

const VALID = { question: '클로저란?', modelAnswer: '', recall: '함수와 렉시컬 환경의 조합' };

test('a well-formed body is returned as-is, ignoring extra fields', () => {
  assert.deepEqual(parseFeedbackInput({ ...VALID, extra: 1 }), VALID);
});

test('non-object bodies are rejected', () => {
  for (const body of [null, undefined, 'text', 42]) assert.equal(parseFeedbackInput(body), null);
});

test('missing or non-string fields are rejected', () => {
  assert.equal(parseFeedbackInput({ question: VALID.question, recall: VALID.recall }), null);
  assert.equal(parseFeedbackInput({ ...VALID, recall: 7 }), null);
});

test('blank question or recall is rejected, a blank model answer is allowed', () => {
  assert.equal(parseFeedbackInput({ ...VALID, question: '   ' }), null);
  assert.equal(parseFeedbackInput({ ...VALID, recall: '\n' }), null);
  assert.deepEqual(parseFeedbackInput({ ...VALID, modelAnswer: '  ' }), { ...VALID, modelAnswer: '  ' });
});

test('each field is limited to its maximum length', () => {
  assert.deepEqual(parseFeedbackInput({ ...VALID, question: 'q'.repeat(500) }), {
    ...VALID,
    question: 'q'.repeat(500),
  });
  assert.equal(parseFeedbackInput({ ...VALID, question: 'q'.repeat(501) }), null);
  assert.equal(parseFeedbackInput({ ...VALID, modelAnswer: 'a'.repeat(8_001) }), null);
  assert.equal(parseFeedbackInput({ ...VALID, recall: 'r'.repeat(4_001) }), null);
});
