import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { forEachAreaModel, type NamedModel } from '../areaModels';

const model = (name: string): NamedModel => ({ name });

describe('forEachAreaModel', () => {
  it('모델 순서대로, 한 모델 안에서는 이름 목록 순서대로 접두사가 맞는 구역을 모두 만든다', () => {
    const calls: string[] = [];
    const children = [model('lab'), model('circuitTrack'), model('unknown'), model('labAnnex')];
    forEachAreaModel(children, ['circuit', 'lab', 'labAnnex'], (name, { name: child }) =>
      calls.push(`${child}→${name}`),
    );
    assert.deepEqual(calls, ['lab→lab', 'circuitTrack→circuit', 'labAnnex→lab', 'labAnnex→labAnnex']);
  });

  it('맞는 이름이 없으면 아무것도 만들지 않는다', () => {
    let count = 0;
    forEachAreaModel([model('decor')], ['lab'], () => (count += 1));
    assert.equal(count, 0);
  });

  it('만드는 도중 바뀐 모델 이름을 다음 구역 판정에 반영한다', () => {
    const calls: string[] = [];
    const renamed = { name: 'lab' };
    forEachAreaModel([renamed], ['lab', 'social'], (name) => {
      calls.push(name);
      renamed.name = 'social';
    });
    assert.deepEqual(calls, ['lab', 'social']);
  });
});
