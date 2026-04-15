import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Link } from "react-router-dom";
import { loadEcosystem, loadPlugins, loadMigrations } from "../utils/data";
import { StatusBadge } from "../components/StatusBadge";
import type { EcosystemStats, PluginSummary, MigrationRecord } from "../types";

interface TimelineEntry {
  month: string;
  success: number;
  fail: number;
}

interface TagEntry {
  tag: string;
  count: number;
}

export function Dashboard() {
  const [eco, setEco] = useState<EcosystemStats | null>(null);
  const [plugins, setPlugins] = useState<PluginSummary[]>([]);
  const [migrations, setMigrations] = useState<MigrationRecord[]>([]);

  useEffect(() => {
    loadEcosystem().then(setEco);
    loadPlugins().then(setPlugins);
    loadMigrations().then(setMigrations);
  }, []);

  const timeline: TimelineEntry[] = useMemo(() => {
    const monthMap = new Map<string, { success: number; fail: number }>();
    for (const m of migrations) {
      if (!m.timestamp) continue;
      const cleanTs = m.timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})$/, "T$1:$2:$3");
      const month = cleanTs.substring(0, 7);
      if (!month) continue;
      const entry = monthMap.get(month) || { success: 0, fail: 0 };
      if (m.migrationStatus === "success") entry.success++;
      else if (m.migrationStatus === "fail") entry.fail++;
      monthMap.set(month, entry);
    }
    const sorted = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([month, data]) => ({
      month,
      success: data.success,
      fail: data.fail,
    }));
  }, [migrations]);

  const tags: TagEntry[] = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const m of migrations) {
      if (!m.tags) continue;
      for (const t of m.tags) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }
    return [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }, [migrations]);

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

      {/* Migration Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Migration Timeline</h2>
          <ReactECharts
            style={{ height: 280 }}
            option={{
              tooltip: { trigger: "axis" },
              legend: { bottom: 0, textStyle: { fontSize: 12 } },
              grid: { left: 50, right: 30, top: 20, bottom: 50 },
              xAxis: {
                type: "category",
                data: timeline.map((t) => t.month),
                axisLabel: { rotate: 45, fontSize: 11 },
              },
              yAxis: { type: "value" },
              series: [
                {
                  name: "Success",
                  type: "bar",
                  stack: "total",
                  data: timeline.map((t) => t.success),
                  itemStyle: { color: "#10b981" },
                },
                {
                  name: "Failed",
                  type: "bar",
                  stack: "total",
                  data: timeline.map((t) => t.fail),
                  itemStyle: { color: "#ef4444" },
                },
              ],
            }}
          />
        </div>
      )}

      {/* Tags Distribution and Plugin Health Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tags Distribution */}
        {tags.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Migration Tags</h2>
            <ReactECharts
              style={{ height: 280 }}
              option={{
                tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
                legend: { bottom: 0, textStyle: { fontSize: 11 }, type: "scroll" },
                series: [
                  {
                    type: "pie",
                    radius: ["35%", "60%"],
                    center: ["50%", "45%"],
                    label: { show: false },
                    data: tags.map((t, i) => ({
                      value: t.count,
                      name: t.tag,
                      itemStyle: { color: getTagColor(i) },
                    })),
                  },
                ],
              }}
            />
          </div>
        )}

        {/* Plugin Health Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Plugin Health Distribution</h2>
          <ReactECharts
            style={{ height: 280 }}
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

function getTagColor(index: number): string {
  const colors = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308",
    "#22c55e", "#14b8a6", "#06b6d4", "#6366f1", "#a855f7",
    "#f43f5e", "#84cc16",
  ];
  return colors[index % colors.length];
}
