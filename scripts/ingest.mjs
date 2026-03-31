/**
 * Ingest script — fetches real data from jenkins-infra/metadata-plugin-modernizer
 * and writes pre-aggregated JSON to public/data/ for the React app.
 *
 * Usage:
 *   node scripts/ingest.mjs              # fetch all plugins
 *   node scripts/ingest.mjs --limit 50   # fetch first 50 (for dev)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "data");
const RAW_BASE = "https://raw.githubusercontent.com/jenkins-infra/metadata-plugin-modernizer/main";
const API_BASE = "https://api.github.com/repos/jenkins-infra/metadata-plugin-modernizer";
const CONCURRENCY = 15;
const SKIP_DIRS = new Set([".github", "reports", ".gitignore", "README.md", "opt-out-plugins.json", "requirements.txt"]);

const limit = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

const headers = {};
if (process.env.GITHUB_TOKEN) {
  headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}
headers["User-Agent"] = "jenkins-plugin-modernizer-stats";

async function fetchJSON(url, useAuth = false) {
  const opts = useAuth ? { headers } : { headers: { "User-Agent": "jenkins-plugin-modernizer-stats" } };
  const res = await fetch(url, opts);
  if (!res.ok) return null;
  return res.json();
}

// Fetch all top-level directory names via the Trees API (single request)
async function listPluginDirs() {
  const tree = await fetchJSON(`${API_BASE}/git/trees/main`, true);
  if (!tree || !tree.tree) {
    console.error("Failed to fetch repo tree. Check GITHUB_TOKEN or rate limit.");
    process.exit(1);
  }
  return tree.tree
    .filter((e) => e.type === "tree" && !SKIP_DIRS.has(e.path))
    .map((e) => e.path);
}

// Run promises with concurrency limit
async function pMap(items, fn, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function computeStatus(successRate) {
  if (successRate >= 90) return "healthy";
  if (successRate >= 50) return "needs-attention";
  return "critical";
}

async function main() {
  console.log("Fetching plugin directories...");
  let pluginDirs = await listPluginDirs();
  console.log(`Found ${pluginDirs.length} plugin directories`);

  if (limit < pluginDirs.length) {
    pluginDirs = pluginDirs.slice(0, limit);
    console.log(`Limited to ${limit} plugins`);
  }

  // Fetch ecosystem summary
  console.log("Fetching ecosystem summary...");
  const ecosystem = await fetchJSON(`${RAW_BASE}/reports/summary.json`);
  if (!ecosystem) {
    console.error("Failed to fetch summary.json");
    process.exit(1);
  }

  // Fetch recipe list
  console.log("Fetching recipe reports...");
  const recipeDir = await fetchJSON(`${API_BASE}/contents/reports/recipes`, true);
  const recipeFiles = recipeDir ? recipeDir.filter((f) => f.name.endsWith(".json")) : [];

  const recipes = (
    await pMap(
      recipeFiles,
      async (f) => fetchJSON(`${RAW_BASE}/reports/recipes/${f.name}`),
      CONCURRENCY
    )
  ).filter(Boolean);
  console.log(`Fetched ${recipes.length} recipe reports`);

  // Fetch per-plugin aggregated data
  console.log(`Fetching plugin data (${pluginDirs.length} plugins, concurrency=${CONCURRENCY})...`);
  let fetched = 0;
  const pluginResults = await pMap(
    pluginDirs,
    async (name) => {
      const data = await fetchJSON(`${RAW_BASE}/${name}/reports/aggregated_migrations.json`);
      fetched++;
      if (fetched % 50 === 0) console.log(`  ${fetched}/${pluginDirs.length}`);
      if (!data || !data.migrations) return null;

      const migrations = data.migrations;
      const success = migrations.filter((m) => m.migrationStatus === "success").length;
      const fail = migrations.filter((m) => m.migrationStatus === "fail").length;
      const total = migrations.length;
      const rate = total > 0 ? (success / total) * 100 : 0;
      const openPRs = migrations.filter((m) => m.pullRequestStatus === "open").length;
      const mergedPRs = migrations.filter((m) => m.pullRequestStatus === "merged").length;
      const tags = [...new Set(migrations.flatMap((m) => m.tags || []))];
      const timestamps = migrations.map((m) => m.timestamp).filter(Boolean).sort();
      const lastMigration = timestamps[timestamps.length - 1] || null;

      return {
        name,
        repository: data.pluginRepository || `https://github.com/jenkinsci/${name}-plugin`,
        totalMigrations: total,
        successCount: success,
        failCount: fail,
        openPRs,
        mergedPRs,
        tags,
        lastMigration,
        status: computeStatus(rate),
        successRate: Math.round(rate * 10) / 10,
        migrations, // full records for detail page
      };
    },
    CONCURRENCY
  );

  const plugins = pluginResults.filter(Boolean);
  console.log(`Successfully fetched ${plugins.length} plugins with data`);

  // Separate summaries (for list) and full data (for details)
  const pluginSummaries = plugins.map(({ migrations, ...summary }) => summary);
  const allMigrations = plugins.flatMap((p) =>
    p.migrations.map((m) => ({ ...m, pluginName: p.name }))
  );

  // Write output
  mkdirSync(OUT_DIR, { recursive: true });

  writeFileSync(join(OUT_DIR, "ecosystem.json"), JSON.stringify(ecosystem, null, 2));
  writeFileSync(join(OUT_DIR, "recipes.json"), JSON.stringify(recipes, null, 2));
  writeFileSync(join(OUT_DIR, "plugins.json"), JSON.stringify(pluginSummaries, null, 2));
  writeFileSync(join(OUT_DIR, "migrations.json"), JSON.stringify(allMigrations, null, 2));

  console.log("\nOutput written to public/data/:");
  console.log(`  ecosystem.json  — ${ecosystem.totalMigrations} total migrations, ${ecosystem.successRate}% success`);
  console.log(`  recipes.json    — ${recipes.length} recipes`);
  console.log(`  plugins.json    — ${pluginSummaries.length} plugin summaries`);
  console.log(`  migrations.json — ${allMigrations.length} migration records`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
