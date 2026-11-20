import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { worldAsset } from '@views/drive/config/worldAsset';

describe('worldAsset', () => {
  it('월드 에셋 상대 경로에 /world/를 붙인다', () => {
    assert.equal(worldAsset('vehicle/default-compressed.glb'), '/world/vehicle/default-compressed.glb');
    assert.equal(worldAsset('./basis/basis_transcoder.js'), '/world/basis/basis_transcoder.js');
  });

  it('이미 해석된 URL은 그대로 둔다', () => {
    for (const url of [
      '/world/vehicle/default.glb',
      '/_next/static/chunk.js',
      'https://lab.danwoo.dev/',
      'data:image/png;base64,AAAA',
      'blob:https://danwoo.dev/1234',
    ])
      assert.equal(worldAsset(url), url);
  });
});
