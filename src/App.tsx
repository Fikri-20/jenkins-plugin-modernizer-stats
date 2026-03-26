import { useEffect, useState } from 'react';
import { aggregateStats, fetchAllMetadata, getMigrationIdStats, getPluginSummaries } from './utils/data';
import { MetricCard } from './components/MetricCard';
import { PluginTable } from './components/PluginTable';
import { MigrationBreakdown } from './components/MigrationBreakdown';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AggregatedStats, MigrationMetadata } from './types';

export function App() {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [metadata, setMetadata] = useState<MigrationMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchAllMetadata();
        setMetadata(data);
        setStats(aggregateStats(data));
      } catch {
        setStats(aggregateStats([]));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingScreen />;
  
  const pluginSummaries = getPluginSummaries(metadata);
  const migrationStats = getMigrationIdStats(metadata);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <Hero stats={stats} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Plugins"
            value={stats?.totalPlugins || 0}
            icon="plugin"
            color="blue"
          />
          <MetricCard
            title="Success Rate"
            value={`${stats?.successRate.toFixed(1) || '0.0'}%`}
            icon="check"
            color="green"
          />
          <MetricCard
            title="Open PRs"
            value={stats?.pluginsWithOpenPRs?.length || 1}
            icon="pr"
            color="orange"
          />
        </div>

        <section id="plugins" className="mb-8 scroll-mt-16">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Plugin Ecosystem</h2>
          <p className="text-slate-600 mb-4">Overview of all tracked plugins and their modernization status.</p>
          
          <PluginTable plugins={pluginSummaries} />
        </section>

        <section id="migrations" className="scroll-mt-8">
          <MigrationBreakdown migrations={migrationStats} />
        </section>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D33833] border-t-transparent"></div>
        <p className="mt-4 text-slate-600">Loading plugin modernization data...</p>
      </div>
    </div>
  );
}