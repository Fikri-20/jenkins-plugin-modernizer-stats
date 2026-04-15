import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { loadRecipes } from "../utils/data";
import type { RecipeStats } from "../types";

interface PluginApplication {
  pluginName: string;
  applied: number;
  success: number;
  failures: number;
  lastRun: string;
}

function shortRecipeName(id: string): string {
  const name = id.split(".").pop() || id;
  return name.replace(/([A-Z])/g, " $1").trim();
}

function formatDate(ts: string): string {
  const clean = ts.replace(/T(\d{2})-(\d{2})-(\d{2})$/, "T$1:$2:$3");
  const d = new Date(clean);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildAffectedPlugins(
  plugins: { pluginName: string; status: string; timestamp: string }[]
): PluginApplication[] {
  const map = new Map<string, PluginApplication>();
  for (const p of plugins) {
    const existing = map.get(p.pluginName) || {
      pluginName: p.pluginName,
      applied: 0,
      success: 0,
      failures: 0,
      lastRun: "",
    };
    existing.applied++;
    if (p.status === "success") existing.success++;
    if (p.status === "fail" || p.status === "failure") existing.failures++;
    if (p.timestamp && p.timestamp > existing.lastRun) {
      existing.lastRun = p.timestamp;
    }
    map.set(p.pluginName, existing);
  }
  return [...map.values()].sort((a, b) => b.failures - a.failures);
}

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const recipeName = decodeURIComponent(id || "");
  const [recipes, setRecipes] = useState<RecipeStats[]>([]);

  useEffect(() => {
    loadRecipes().then(setRecipes);
  }, []);

  const recipe = useMemo(() => {
    return recipes.find((r) => r.recipeId === recipeName);
  }, [recipes, recipeName]);

  const successRate = useMemo(() => {
    if (!recipe) return 0;
    if (recipe.totalApplications === 0) return 0;
    return (recipe.successCount / recipe.totalApplications) * 100;
  }, [recipe]);

  const statusChartOption = useMemo(() => {
    if (!recipe) return {};
    const pendingCount = recipe.totalApplications - recipe.successCount - recipe.failureCount;
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: "0%", textStyle: { color: "#64748b" } },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
          label: { show: false, position: "center" },
          emphasis: { label: { show: true, fontSize: 18, fontWeight: "bold" } },
          labelLine: { show: false },
          data: [
            { value: recipe.successCount, name: "Success", itemStyle: { color: "#22c55e" } },
            { value: recipe.failureCount, name: "Failed", itemStyle: { color: "#ef4444" } },
            ...(pendingCount > 0 ? [{ value: pendingCount, name: "Pending", itemStyle: { color: "#f59e0b" } }] : []),
          ],
        },
      ],
    };
  }, [recipe]);

  const timelineOption = useMemo(() => {
    if (!recipe?.plugins || recipe.plugins.length === 0) return null;
    const monthMap = new Map<string, { success: number; fail: number }>();
    for (const p of recipe.plugins) {
      const month = p.timestamp?.substring(0, 7) || "";
      if (!month) continue;
      const entry = monthMap.get(month) || { success: 0, fail: 0 };
      if (p.status === "success") entry.success++;
      else entry.fail++;
      monthMap.set(month, entry);
    }
    if (monthMap.size < 2) return null;
    const months = [...monthMap.keys()].sort();
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: "0%", textStyle: { color: "#64748b" } },
      grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
      xAxis: { type: "category" as const, data: months, axisLabel: { color: "#64748b", rotate: 45 } },
      yAxis: { type: "value" as const, axisLabel: { color: "#64748b" } },
      series: [
        { name: "Success", type: "bar" as const, stack: "total", data: months.map((m) => monthMap.get(m)?.success || 0), itemStyle: { color: "#4ade80" } },
        { name: "Failed", type: "bar" as const, stack: "total", data: months.map((m) => monthMap.get(m)?.fail || 0), itemStyle: { color: "#f87171" } },
      ],
    };
  }, [recipe]);

  const affectedPlugins = useMemo(() => (recipe?.plugins ? buildAffectedPlugins(recipe.plugins) : []), [recipe]);

  const failureRows = useMemo(() => {
    if (!recipe?.plugins) return [];
    return recipe.plugins
      .filter((p) => p.status === "fail" || p.status === "failure")
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="space-y-4">
        <Link to="/recipes" className="text-sm text-slate-500 hover:text-slate-700">
          \u2190 Recipes
        </Link>
        <div className="text-center py-20 text-slate-500">Loading...</div>
      </div>
    );
  }

  const pendingCount = recipe.totalApplications - recipe.successCount - recipe.failureCount;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/recipes" className="text-sm text-slate-500 hover:text-slate-700">
        \u2190 Recipes
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{shortRecipeName(recipe.recipeId)}</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">{recipe.recipeId}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-blue-700">{recipe.totalApplications}</div>
              <div className="text-xs text-blue-600 font-medium">Total</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-emerald-700">{recipe.successCount}</div>
              <div className="text-xs text-emerald-600 font-medium">Success</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-red-700">{recipe.failureCount}</div>
              <div className="text-xs text-red-600 font-medium">Failed</div>
            </div>
            {pendingCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
                <div className="text-xs text-amber-600 font-medium">Pending</div>
              </div>
            )}
            <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-violet-700">{successRate.toFixed(1)}%</div>
              <div className="text-xs text-violet-600 font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h2>
          <ReactECharts style={{ height: 280 }} option={statusChartOption} />
        </div>
        {timelineOption && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Application Timeline</h2>
            <ReactECharts style={{ height: 280 }} option={timelineOption} />
          </div>
        )}
      </div>

      {affectedPlugins.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Affected Plugins ({affectedPlugins.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plugin</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-500 uppercase">Applied</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-500 uppercase">Success</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-500 uppercase">Failures</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Last Run</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affectedPlugins.slice(0, 20).map((p) => {
                  const status = p.failures > 0 && p.success > 0 ? "partial" : p.failures > 0 ? "failed" : p.success > 0 ? "success" : "pending";
                  return (
                    <tr key={p.pluginName} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link to={`/plugin/${p.pluginName}`} className="text-sm text-blue-600 hover:underline font-medium">
                          {p.pluginName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-mono">{p.applied}</td>
                      <td className="px-5 py-3 text-center text-sm font-mono text-emerald-600">{p.success}</td>
                      <td className="px-5 py-3 text-center text-sm font-mono text-red-600">{p.failures}</td>
                      <td className="px-5 py-3 text-sm font-mono text-slate-500">{formatDate(p.lastRun)}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "partial"
                              ? "bg-amber-100 text-amber-800"
                              : status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {failureRows.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <span className="text-red-500">\u2716</span>
            <h2 className="text-sm font-semibold text-slate-700">Failure Breakdown ({failureRows.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plugin</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {failureRows.slice(0, 20).map((row, i) => (
                  <tr key={`${row.pluginName}-${i}`} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to={`/plugin/${row.pluginName}`} className="text-sm text-blue-600 hover:underline">
                        {row.pluginName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-slate-500">{formatDate(row.timestamp)}</td>
                    <td className="px-5 py-3">
                      <Link to={`/plugin/${row.pluginName}`} className="text-xs text-blue-600 hover:underline">
                        View Plugin \u2192
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">All Plugin Applications ({recipe.plugins.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plugin</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipe.plugins.slice(0, 50).map((plugin, idx) => (
                <tr key={`${plugin.pluginName}-${idx}`} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm font-medium">{plugin.pluginName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        plugin.status === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : plugin.status === "fail" || plugin.status === "failure"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {plugin.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-slate-500">{formatDate(plugin.timestamp)}</td>
                  <td className="px-5 py-3">
                    <Link to={`/plugin/${plugin.pluginName}`} className="text-xs text-blue-600 hover:underline">
                      View Plugin \u2192
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}