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
            stroke="#fff4c6"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        );
      })}
      {LANDMARKS.filter((p) => p.region === region).map((p) => {
        const isCollected = visited.includes(p.id);
        return (
          <g key={p.id} transform={`translate(${mapX(p.x)}, ${mapY(p.z)})`}>
            <circle r="12" fill={isCollected ? '#526b49' : '#faf4de'} stroke="#8a9a71" />
            <text textAnchor="middle" dy="5" fontSize="13" fill={isCollected ? '#fff8df' : '#526b49'}>
              {isCollected ? '✓' : p.icon}
            </text>
            <text
              textAnchor="middle"
              y="27"
              fontSize="10"
              fill="#fffbe7"
              stroke="#304431"
              strokeWidth="2"
              paintOrder="stroke"
            >
              {p.short}
            </text>
          </g>
        );
      })}
      {getWorldPortals(region).map((portal) => (
        <g key={portal.node} transform={`translate(${mapX(portal.center.x)}, ${mapY(portal.center.z)})`}>
          <title>{`${portal.label} 출구`}</title>
          <text textAnchor="middle" dominantBaseline="central" fill="#47745b" fontSize="10">
            {portal.label}
          </text>
        </g>
      ))}
      <circle cx={mapX(position.x)} cy={mapY(position.z)} r="10" fill="#e99b4e" opacity="0.4" />
      <circle cx={mapX(position.x)} cy={mapY(position.z)} r="5" fill="#e99b4e" stroke="#fff7e8" strokeWidth="2" />
    </svg>
  );
}
