import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadPlugins } from "../utils/data";
import { StatusBadge } from "../components/StatusBadge";
import type { PluginSummary } from "../types";

type SortKey = "name" | "totalMigrations" | "successRate" | "failCount" | "openPRs";
type SortDir = "asc" | "desc";
type Status = "all" | "healthy" | "needs-attention" | "critical";

const PAGE_SIZE = 30;

export function PluginList() {
  const [plugins, setPlugins] = useState<PluginSummary[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  useEffect(() => { loadPlugins().then(setPlugins); }, []);

  const filtered = useMemo(() => {
    let list = plugins;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (status !== "all") {
      list = list.filter((p) => p.status === status);
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [plugins, search, status, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, status, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function SortHeader({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col;
    return (
      <th
        className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase cursor-pointer select-none hover:text-slate-700"
        onClick={() => toggleSort(col)}
      >
        {label} {active ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-800">Plugins ({filtered.length})</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#D33833]/30 focus:border-[#D33833]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D33833]/30"
        >
          <option value="all">All Statuses</option>
          <option value="healthy">Healthy</option>
          <option value="needs-attention">Needs Attention</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortHeader label="Plugin Name" col="name" />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <SortHeader label="Migrations" col="totalMigrations" />
              <SortHeader label="Success %" col="successRate" />
              <SortHeader label="Failures" col="failCount" />
              <SortHeader label="Open PRs" col="openPRs" />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((p) => (
              <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/plugin/${p.name}`} className="text-sm font-mono text-blue-600 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{p.totalMigrations}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 bg-slate-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${p.successRate >= 90 ? "bg-emerald-500" : p.successRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${p.successRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-slate-600">{p.successRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-red-600">{p.failCount || "—"}</td>
                <td className="px-4 py-3 text-sm font-mono text-orange-600">{p.openPRs || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-mono">{t}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No plugins match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded border ${page === p ? "bg-[#D33833] text-white border-[#D33833]" : "border-slate-300 hover:bg-slate-100"}`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
