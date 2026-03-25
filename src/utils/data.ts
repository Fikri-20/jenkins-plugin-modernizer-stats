import { MigrationMetadata, AggregatedStats, PluginSummary } from '../types';

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'jenkins-infra';
const REPO_NAME = 'metadata-plugin-modernizer';

export async function fetchPluginList(): Promise<string[]> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents`);
  if (!response.ok) throw new Error('Failed to fetch plugin list');
  
  const data = await response.json();
  const plugins = data
    .filter((item: any) => item.type === 'dir' && !item.name.startsWith('.'))
    .map((item: any) => item.name);
  
  return plugins;
}

export async function fetchPluginMetadata(pluginName: string): Promise<MigrationMetadata[]> {
  try {
    const metadataPath = `${pluginName}/modernization-metadata`;
    const response = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${metadataPath}`);
    
    if (!response.ok) return [];
    
    const files = await response.json();
    const jsonFiles = files.filter((f: any) => f.name.endsWith('.json'));
    
    const metadata: MigrationMetadata[] = [];
    
    for (const file of jsonFiles.slice(0, 10)) {
      const fileResponse = await fetch(file.download_url);
      if (fileResponse.ok) {
        const data = await fileResponse.json();
        metadata.push(data);
      }
    }
    
    return metadata.sort((a, b) => 
      new Date(b.key).getTime() - new Date(a.key).getTime()
    );
  } catch (error) {
    console.error(`Error fetching metadata for ${pluginName}:`, error);
    return [];
  }
}

export async function fetchAllMetadata(sampleSize: number = 50): Promise<MigrationMetadata[]> {
  const plugins = await fetchPluginList();
  const sampledPlugins = plugins.slice(0, sampleSize);
  
  const allMetadata: MigrationMetadata[] = [];
  
  await Promise.all(
    sampledPlugins.map(async (plugin) => {
      const metadata = await fetchPluginMetadata(plugin);
      allMetadata.push(...metadata);
    })
  );
  
  return allMetadata;
}

export function aggregateStats(metadata: MigrationMetadata[]): AggregatedStats {
  const uniquePlugins = new Set(metadata.map(m => m.pluginName));
  const successful = metadata.filter(m => m.migrationStatus === 'success');
  const failed = metadata.filter(m => m.migrationStatus === 'fail');
  const openPRs = metadata.filter(m => m.pullRequestStatus === 'open');
  const mergedPRs = metadata.filter(m => m.pullRequestStatus === 'merged');
  
  return {
    totalPlugins: uniquePlugins.size,
    totalMigrations: metadata.length,
    successfulMigrations: successful.length,
    failedMigrations: failed.length,
    successRate: metadata.length > 0 ? (successful.length / metadata.length) * 100 : 0,
    migrationIds: [...new Set(metadata.map(m => m.migrationId))],
    pluginsWithFailures: [...new Set(failed.map(m => m.pluginName))],
    pluginsWithOpenPRs: [...new Set(openPRs.map(m => m.pluginName))],
    pluginsWithMergedPRs: [...new Set(mergedPRs.map(m => m.pluginName))],
  };
}

export function getPluginSummaries(metadata: MigrationMetadata[]): PluginSummary[] {
  const pluginMap = new Map<string, MigrationMetadata[]>();
  
  metadata.forEach(m => {
    if (!pluginMap.has(m.pluginName)) {
      pluginMap.set(m.pluginName, []);
    }
    pluginMap.get(m.pluginName)!.push(m);
  });
  
  const summaries: PluginSummary[] = [];
  
  pluginMap.forEach((migrations, name) => {
    const successful = migrations.filter(m => m.migrationStatus === 'success').length;
    const failed = migrations.filter(m => m.migrationStatus === 'fail').length;
    const openPRs = migrations.filter(m => m.pullRequestStatus === 'open').length;
    const mergedPRs = migrations.filter(m => m.pullRequestStatus === 'merged').length;
    const closedPRs = migrations.filter(m => m.pullRequestStatus === 'closed').length;
    
    const lastMigration = migrations.sort((a, b) => 
      new Date(b.key).getTime() - new Date(a.key).getTime()
    )[0]?.key;
    
    let status: 'healthy' | 'needs-attention' | 'critical' = 'healthy';
    if (failed > 0) status = 'critical';
    else if (openPRs > 0) status = 'needs-attention';
    
    summaries.push({
      name,
      totalMigrations: migrations.length,
      successfulMigrations: successful,
      failedMigrations: failed,
      lastMigration,
      status,
      openPRs,
      mergedPRs,
      failedPRs: closedPRs,
    });
  });
  
  return summaries.sort((a, b) => a.name.localeCompare(b.name));
}

export function getMigrationIdStats(metadata: MigrationMetadata[]): Record<string, { total: number; success: number; fail: number }> {
  const stats: Record<string, { total: number; success: number; fail: number }> = {};
  
  metadata.forEach(m => {
    if (!stats[m.migrationId]) {
      stats[m.migrationId] = { total: 0, success: 0, fail: 0 };
    }
    stats[m.migrationId].total++;
    if (m.migrationStatus === 'success') stats[m.migrationId].success++;
    if (m.migrationStatus === 'fail') stats[m.migrationId].fail++;
  });
  
  return stats;
}