import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GRASS_QUALITY, grassLodForRing, type GrassQuality } from '@views/ride/model/grass/constants';

const QUALITIES = Object.keys(GRASS_QUALITY) as GrassQuality[];
const RINGS_TO_PROBE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

test('grassLodForRing은 같은 링에 같은 객체를 돌려준다 — GrassChunk memo가 부모 리렌더에 청크를 다시 만들지 않는 근거', () => {
  for (const quality of QUALITIES) {
    for (const ring of RINGS_TO_PROBE) {
      const lod = grassLodForRing(quality, ring);
      assert.equal(grassLodForRing(quality, ring), lod);
      assert.ok(GRASS_QUALITY[quality].rings.includes(lod));
    }
  }
});
