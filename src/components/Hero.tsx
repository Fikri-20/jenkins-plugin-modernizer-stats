import { AggregatedStats } from '../types';

interface HeroProps {
  stats: AggregatedStats | null;
}

export function Hero({ stats }: HeroProps) {
  return (
    <div className="bg-gradient-to-br from-[#D33833] to-[#0B5394] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Plugin Modernizer Stats
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Real-time visibility into the Jenkins plugin ecosystem modernization progress.
            Track migrations, identify outdated plugins, and monitor upgrade paths.
          </p>
        </div>
        
        {stats && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono">{stats.totalPlugins}</div>
              <div className="text-sm text-white/70 mt-1">Total Plugins</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono">{stats.totalMigrations}</div>
              <div className="text-sm text-white/70 mt-1">Migrations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono">
                {stats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-white/70 mt-1">Success Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono">
                {stats.pluginsWithMergedPRs.length}
              </div>
              <div className="text-sm text-white/70 mt-1">Merged PRs</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}