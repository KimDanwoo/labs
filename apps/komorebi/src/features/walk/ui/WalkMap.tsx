import { getWorldPortals } from '@shared/world/portals';
import { LANDMARKS, WORLDS, type Point, type Region } from '@shared/world/world';

type Props = { region: Region; position: Point; visited: readonly string[] };

const MAP_SCALE_X = 4;
const MAP_SCALE_Y = 3;
const mapX = (x: number) => x * MAP_SCALE_X;
const mapY = (z: number) => z * MAP_SCALE_Y;

export function WalkMap({ region, position, visited }: Props) {
  const world = WORLDS[region];
  const nodeById = new Map(world.nodes.map((node) => [node.id, node]));
  return (
    <svg
      className="village-map"
      viewBox="0 0 400 300"
      role="img"
      aria-label={`${world.name} 지도. 현재 좌표 ${Math.round(position.x)}, ${Math.round(position.z)}`}
    >
      <image href={world.image} width="400" height="300" preserveAspectRatio="none" opacity=".75" />
      {world.routes.map((edge) => {
        const a = nodeById.get(edge.a);
        const b = nodeById.get(edge.b);
        if (!a || !b) return null;
        return (
          <line
            key={edge.a + edge.b}
            x1={mapX(a.x)}
            y1={mapY(a.z)}
            x2={mapX(b.x)}
            y2={mapY(b.z)}
            className="map-route"
          />
        );
      })}
      {LANDMARKS.filter((p) => p.region === region).map((p) => {
        const isCollected = visited.includes(p.id);
        return (
          <g
            key={p.id}
            className={`map-landmark ${isCollected ? 'is-collected' : ''}`}
            transform={`translate(${mapX(p.x)}, ${mapY(p.z)})`}
          >
            <circle r="12" />
            <text className="map-landmark-icon" textAnchor="middle" dy="5" fontSize="13">
              {isCollected ? '✓' : p.icon}
            </text>
            <text className="map-landmark-label" textAnchor="middle" y="27" fontSize="10" paintOrder="stroke">
              {p.short}
            </text>
          </g>
        );
      })}
      {getWorldPortals(region).map((portal) => (
        <g key={portal.node} transform={`translate(${mapX(portal.center.x)}, ${mapY(portal.center.z)})`}>
          <title>{`${portal.label} 출구`}</title>
          <text className="map-exit" textAnchor="middle" dominantBaseline="central" fontSize="10">
            {portal.label}
          </text>
        </g>
      ))}
      <circle className="map-player-halo" cx={mapX(position.x)} cy={mapY(position.z)} r="10" />
      <circle className="map-player" cx={mapX(position.x)} cy={mapY(position.z)} r="5" />
    </svg>
  );
}
