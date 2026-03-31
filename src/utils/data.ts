import type { EcosystemStats, PluginSummary, RecipeStats, MigrationRecord } from "../types";

const BASE = import.meta.env.BASE_URL + "data";

async function load<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return res.json();
}

export const loadEcosystem = () => load<EcosystemStats>("ecosystem.json");
export const loadPlugins = () => load<PluginSummary[]>("plugins.json");
export const loadRecipes = () => load<RecipeStats[]>("recipes.json");
export const loadMigrations = () => load<MigrationRecord[]>("migrations.json");
