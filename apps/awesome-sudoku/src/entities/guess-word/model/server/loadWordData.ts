import { GUESS_WORD_DATA } from '@entities/guess-word/config/guessWord';
import { createWordData, type WordData } from '@entities/guess-word/lib/puzzle';
import { createWordVectors } from '@entities/guess-word/lib/similarity';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIRECTORY = path.join(process.cwd(), 'data', 'guess-word');

let dataRequest: Promise<WordData> | undefined;

async function readLines(fileName: string): Promise<string[]> {
  const text = await readFile(path.join(DATA_DIRECTORY, fileName), 'utf8');
  return text.split('\n').filter((line) => line.length > 0);
}

async function readSenseWords(): Promise<string[]> {
  const lines = await readLines(GUESS_WORD_DATA.senses);
  return lines.map((line) => line.split(GUESS_WORD_DATA.senseSeparator)[0] ?? '');
}

async function readVectors(rowCount: number): Promise<Int8Array> {
  const buffer = await readFile(path.join(DATA_DIRECTORY, GUESS_WORD_DATA.vectors));
  const values = new Int8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const isMatchingSize = values.length === rowCount * GUESS_WORD_DATA.dimensions;
  if (!isMatchingSize) throw new Error(`벡터 크기(${values.length})가 행 수(${rowCount})와 맞지 않는다.`);
  return values;
}

async function readWordData(): Promise<WordData> {
  const [words, answers, senseWords] = await Promise.all([
    readLines(GUESS_WORD_DATA.words),
    readLines(GUESS_WORD_DATA.answers),
    readSenseWords(),
  ]);
  const values = await readVectors(words.length + senseWords.length);
  return createWordData(words, answers, createWordVectors(values, GUESS_WORD_DATA.dimensions), senseWords);
}

export function loadWordData(): Promise<WordData> {
  dataRequest ??= readWordData().catch((error: unknown) => {
    dataRequest = undefined;
    throw error;
  });
  return dataRequest;
}
