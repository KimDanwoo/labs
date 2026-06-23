import { HAYSTACKS, HOUSES, TREES } from '../model/constants';
import { Ground } from './Ground';
import { Haystack } from './Haystack';
import { House } from './House';
import { Pond } from './Pond';
import { Tree } from './Tree';

// 들판에 흩뿌린 시골 요소(집·나무·건초·연못). 도로 없음.
export function Village() {
  return (
    <group>
      <Ground />
      <Pond />

      {HOUSES.map((house, i) => (
        <House key={`house-${i}`} {...house} />
      ))}
      {TREES.map((tree, i) => (
        <Tree key={`tree-${i}`} {...tree} />
      ))}
      {HAYSTACKS.map((hay, i) => (
        <Haystack key={`hay-${i}`} {...hay} />
      ))}
    </group>
  );
}
