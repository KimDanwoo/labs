import { NOT_LOADED, STAT_CARDS } from '../../config/progress';
import { useProgressStatsContext } from '../../model/hooks/useProgressStatsContext';
import { StatCard } from './StatCard';

export function ProgressStats() {
  const { stats } = useProgressStatsContext();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
      {STAT_CARDS.map((config) => (
        <StatCard key={config.key} config={config} value={stats?.[config.key] ?? NOT_LOADED} />
      ))}
    </div>
  );
}
