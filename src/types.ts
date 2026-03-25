export interface MigrationMetadata {
  pluginName: string;
  pluginRepository: string;
  pluginVersion: string;
  jenkinsBaseline: string;
  targetBaseline: string;
  effectiveBaseline: string;
  jenkinsVersion: string;
  migrationName: string;
  migrationDescription: string;
  tags: string[];
  migrationId: string;
  migrationStatus: 'success' | 'fail' | 'skipped' | 'dry-run';
  pullRequestUrl: string;
  pullRequestStatus: 'open' | 'closed' | 'merged' | null;
  dryRun: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  key: string;
  path: string;
  checkRuns?: Record<string, string>;
  checkRunsSummary?: string;
  timestamp?: string;
}

export interface AggregatedStats {
  totalPlugins: number;
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  successRate: number;
  migrationIds: string[];
  pluginsWithFailures: string[];
  pluginsWithOpenPRs: string[];
  pluginsWithMergedPRs: string[];
}

export interface PluginSummary {
  name: string;
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  lastMigration?: string;
  status: 'healthy' | 'needs-attention' | 'critical';
  openPRs: number;
  mergedPRs: number;
  failedPRs: number;
}

export interface MigrationBreakdownProps {
  migrations: Record<string, { total: number; success: number; fail: number }>;
}