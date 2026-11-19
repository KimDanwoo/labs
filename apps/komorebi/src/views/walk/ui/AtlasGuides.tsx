import { useWalkContext } from '../model/hooks/useWalkContext';
import { FISHING_PIER, HOME_AQUARIUM, PIER_CAT } from '../model/world/landmarks';
import { HOME } from '../model/world/world';
import { Icon } from './Icon';
import { WalkMap } from './WalkMap';

export function AtlasGuides() {
  const { isReady, status, collection, guideTo } = useWalkContext();
  return (
    <>
      {[HOME_AQUARIUM, PIER_CAT].map((place) => (
        <button key={place.id} className="home-guide" onClick={() => guideTo(place.id)} disabled={!isReady}>
          <span aria-hidden="true">{place.icon}</span>
          <span>
            <strong>{place.name}</strong>
            <small>{place.id === HOME_AQUARIUM.id ? '수조 물고기 만나러 가기' : '삼색이에게 인사하러 가기'}</small>
          </span>
          <Icon name="arrow" />
        </button>
      ))}
      <WalkMap region={status.region} position={status} visited={collection.visited} />
      <button className="home-guide" onClick={() => guideTo(HOME.id)} disabled={!isReady}>
        <Icon name="home" />
        <span>
          <strong>{HOME.name}</strong>
          <small>집에 돌아가 쉬어 가기</small>
        </span>
        <Icon name="arrow" />
      </button>
      <button className="home-guide pier-guide" onClick={() => guideTo(FISHING_PIER.id)} disabled={!isReady}>
        <span aria-hidden="true">🎣</span>
        <span>
          <strong>바다 낚시 부두</strong>
          <small>창고 옆 돌부두까지 걸어가기</small>
        </span>
        <Icon name="arrow" />
      </button>
    </>
  );
}
