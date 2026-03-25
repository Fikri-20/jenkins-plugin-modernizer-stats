import { MigrationMetadata, AggregatedStats, PluginSummary } from '../types';
import sampleData from '../../public/data/sample-data.json';

export async function fetchAllMetadata(): Promise<MigrationMetadata[]> {
  return Promise.resolve([]);
}

export function aggregateStats(_metadata: MigrationMetadata[]): AggregatedStats {
  return {
    totalPlugins: sampleData.aggregatedStats.totalPlugins,
    totalMigrations: sampleData.aggregatedStats.totalMigrations,
    successfulMigrations: sampleData.aggregatedStats.successfulMigrations,
    failedMigrations: sampleData.aggregatedStats.failedMigrations,
    successRate: sampleData.aggregatedStats.successRate,
    migrationIds: Object.keys(sampleData.migrationTypes),
    pluginsWithFailures: sampleData.plugins
      .filter((p) => p.failedMigrations > 0)
      .map((p) => p.name),
    pluginsWithOpenPRs: sampleData.plugins
      .filter((p) => p.openPRs > 0)
      .map((p) => p.name),
    pluginsWithMergedPRs: sampleData.plugins
      .filter((p) => p.mergedPRs > 0)
      .map((p) => p.name),
  };
}

export function getPluginSummaries(_metadata: MigrationMetadata[]): PluginSummary[] {
  return sampleData.plugins as PluginSummary[];
}

export function getMigrationIdStats(_metadata: MigrationMetadata[]): Record<string, { total: number; success: number; fail: number }> {
  return sampleData.migrationTypes as Record<string, { total: number; success: number; fail: number }>;
}