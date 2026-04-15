// Real metadata schema from jenkins-infra/metadata-plugin-modernizer

export interface MigrationRecord {
  pluginName: string;
  pluginRepository?: string;
  pluginVersion?: string;
  jenkinsBaseline?: string;
  migrationName: string;
  migrationDescription?: string;
  tags: string[];
  migrationId: string;
  migrationStatus: "success" | "fail" | "skipped" | "dry-run";
  pullRequestUrl?: string;
  pullRequestStatus?: "open" | "closed" | "merged" | null;
  dryRun?: boolean;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  key?: string;
  timestamp?: string;
  checkRuns?: Record<string, string>;
  checkRunsSummary?: string;
}

export interface PluginSummary {
  name: string;
  repository: string;
  totalMigrations: number;
  successCount: number;
  failCount: number;
  openPRs: number;
  mergedPRs: number;
  tags: string[];
  lastMigration: string | null;
  status: "healthy" | "needs-attention" | "critical";
  successRate: number;
}

export interface EcosystemStats {
  generatedOn: string;
  totalMigrations: number;
  failedMigrations: number;
  successRate: number;
  failuresByRecipe: { recipeId: string; failures: number }[];
  pluginsWithFailures: string[];
}

export interface RecipeStats {
  recipeId: string;
  totalApplications: number;
  successCount: number;
  failureCount: number;
  successRate?: number;
  plugins: { pluginName: string; status: string; timestamp: string }[];
}

export interface RecipeSummary {
  recipeId: string;
  totalApplications: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}
