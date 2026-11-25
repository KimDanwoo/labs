import {
  GUESS_WORD_API,
  GUESS_WORD_ERROR,
  type GuessErrorBody,
  type GuessRequestBody,
  type GuessResult,
  type HintsResult,
  type YesterdayResult,
} from '@entities/guess-word';
import { NOTICE_KIND } from '@views/guess-word/config/game';
import type { NoticeKind } from '@views/guess-word/model/types/guessWord';

const ERROR_NOTICE: Record<string, NoticeKind> = {
  [GUESS_WORD_ERROR.INVALID]: NOTICE_KIND.INVALID,
  [GUESS_WORD_ERROR.UNKNOWN]: NOTICE_KIND.UNKNOWN,
  [GUESS_WORD_ERROR.BOT]: NOTICE_KIND.BOT,
};

export class GuessRequestError extends Error {
  readonly kind: NoticeKind;

  constructor(kind: NoticeKind) {
    super(kind);
    this.kind = kind;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGuessErrorBody(value: unknown): value is GuessErrorBody {
  return isObject(value) && typeof value.error === 'string';
}

function isGuessResult(value: unknown): value is GuessResult {
  if (!isObject(value)) return false;
  const hasValidRank = value.rank === null || typeof value.rank === 'number';
  const hasWord = typeof value.word === 'string' && typeof value.isAnswer === 'boolean';
  return typeof value.day === 'number' && typeof value.similarity === 'number' && hasWord && hasValidRank;
}

function isRankHint(value: unknown): boolean {
  return isObject(value) && typeof value.rank === 'number' && typeof value.similarity === 'number';
}

function isHintsResult(value: unknown): value is HintsResult {
  if (!isObject(value)) return false;
  const { day, hints } = value;
  const hasValidHints = Array.isArray(hints) && hints.every(isRankHint);
  return typeof day === 'number' && hasValidHints;
}

function isYesterdayResult(value: unknown): value is YesterdayResult {
  if (!isObject(value)) return false;
  const hasValidWord = value.word === null || typeof value.word === 'string';
  return typeof value.day === 'number' && hasValidWord;
}

async function readJson(url: string, init?: RequestInit): Promise<{ isOk: boolean; body: unknown }> {
  const response = await fetch(url, { cache: 'no-store', ...init }).catch(() => {
    throw new GuessRequestError(NOTICE_KIND.NETWORK);
  });
  const body: unknown = await response.json().catch(() => null);
  return { isOk: response.ok, body };
}

async function requestValidated<T>(
  url: string,
  isValid: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<T> {
  const { isOk, body } = await readJson(url, init);
  if (isGuessErrorBody(body)) throw new GuessRequestError(ERROR_NOTICE[body.error] ?? NOTICE_KIND.NETWORK);
  const isExpectedBody = isOk && isValid(body);
  if (!isExpectedBody) throw new GuessRequestError(NOTICE_KIND.NETWORK);
  return body;
}

export function requestGuess(word: string): Promise<GuessResult> {
  const body: GuessRequestBody = { word };
  return requestValidated(GUESS_WORD_API.guess, isGuessResult, {
    method: GUESS_WORD_API.guessMethod,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function requestHints(): Promise<HintsResult> {
  return requestValidated(GUESS_WORD_API.hints, isHintsResult);
}

export function requestYesterday(): Promise<YesterdayResult> {
  return requestValidated(GUESS_WORD_API.yesterday, isYesterdayResult);
}

export function noticeKindOf(error: unknown): NoticeKind {
  return error instanceof GuessRequestError ? error.kind : NOTICE_KIND.NETWORK;
}
