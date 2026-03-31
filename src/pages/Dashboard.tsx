import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Link } from "react-router-dom";
import { loadEcosystem, loadPlugins } from "../utils/data";
import { StatusBadge } from "../components/StatusBadge";
import type { EcosystemStats, PluginSummary } from "../types";

export function Dashboard() {
  const [eco, setEco] = useState<EcosystemStats | null>(null);
  const [plugins, setPlugins] = useState<PluginSummary[]>([]);

  useEffect(() => {
    loadEcosystem().then(setEco);
    loadPlugins().then(setPlugins);
  }, []);

  if (!eco) {
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  }

  const successCount = eco.totalMigrations - eco.failedMigrations;
  const criticalPlugins = plugins
    .filter((p) => p.status === "critical")
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Total Plugins" value={plugins.length} />
        <Card label="Total Migrations" value={eco.totalMigrations} />
        <Card label="Success Rate" value={`${eco.successRate}%`} accent={eco.successRate >= 70} />
        <Card label="Failed Migrations" value={eco.failedMigrations} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migration Status Donut */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Migration Status</h2>
          <ReactECharts
            style={{ height: 280 }}
            option={{
              tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
              legend: { bottom: 0, textStyle: { fontSize: 12 } },
              series: [
                {
                  type: "pie",
                  radius: ["45%", "70%"],
                  avoidLabelOverlap: false,
                  label: { show: false },
                  data: [
                    { value: successCount, name: "Success", itemStyle: { color: "#10b981" } },
                    { value: eco.failedMigrations, name: "Failed", itemStyle: { color: "#ef4444" } },
                  ],
                },
              ],
            }}
          />
        </div>

        {/* Failures by Recipe */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Failures by Recipe</h2>
          <ReactECharts
            style={{ height: 280 }}
            option={{
              tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
              grid: { left: 200, right: 30, top: 10, bottom: 20 },
              xAxis: { type: "value" },
              yAxis: {
                type: "category",
                data: eco.failuresByRecipe
                  .slice(0, 8)
                  .reverse()
                  .map((r) => shortRecipeName(r.recipeId)),
                axisLabel: { fontSize: 11, width: 180, overflow: "truncate" },
              },
              series: [
                {
                  type: "bar",
                  data: eco.failuresByRecipe.slice(0, 8).reverse().map((r) => r.failures),
                  itemStyle: { color: "#ef4444", borderRadius: [0, 4, 4, 0] },
                  barMaxWidth: 24,
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Plugin Health Distribution */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Plugin Health Distribution</h2>
        <ReactECharts
          style={{ height: 220 }}
          option={{
            tooltip: { trigger: "item", formatter: "{b}: {c} plugins ({d}%)" },
            legend: { bottom: 0, textStyle: { fontSize: 12 } },
            series: [
              {
                type: "pie",
                radius: ["40%", "65%"],
                label: { show: false },
                data: [
                  {
                    value: plugins.filter((p) => p.status === "healthy").length,
                    name: "Healthy",
                    itemStyle: { color: "#10b981" },
                  },
                  {
                    value: plugins.filter((p) => p.status === "needs-attention").length,
                    name: "Needs Attention",
                    itemStyle: { color: "#f59e0b" },
                  },
                  {
                    value: plugins.filter((p) => p.status === "critical").length,
                    name: "Critical",
                    itemStyle: { color: "#ef4444" },
                  },
                ],
              },
            ],
          }}
        />
      </div>

      {/* Critical plugins table */}
      {criticalPlugins.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Plugins Needing Attention</h2>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Plugin</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Failures</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalPlugins.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/plugin/${p.name}`} className="text-sm font-mono text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-sm font-mono text-red-600">{p.failCount}</td>
                  <td className="px-5 py-3 text-sm font-mono">{p.successRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${accent === false ? "text-red-600" : accent ? "text-emerald-600" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}

function shortRecipeName(id: string): string {
  const name = id.split(".").pop() || id;
  return name.replace(/([A-Z])/g, " $1").trim();
}
