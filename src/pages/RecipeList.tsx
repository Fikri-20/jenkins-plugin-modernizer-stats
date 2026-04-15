import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadRecipes } from "../utils/data";
import type { RecipeStats } from "../types";

type SortKey = "name" | "totalApplications" | "successCount" | "failureCount" | "successRate";
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "healthy" | "needs-attention" | "critical";

const PAGE_SIZE = 30;

function getSuccessRate(recipe: RecipeStats): number {
  if (recipe.totalApplications === 0) return 0;
  return (recipe.successCount / recipe.totalApplications) * 100;
}

function getStatus(successRate: number): "healthy" | "needs-attention" | "critical" {
  if (successRate >= 80) return "healthy";
  if (successRate >= 50) return "needs-attention";
  return "critical";
}

function shortRecipeName(id: string): string {
  const name = id.split(".").pop() || id;
  return name.replace(/([A-Z])/g, " $1").trim();
}

export function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeStats[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("failureCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadRecipes().then((data) => {
      const withRates = data.map((r) => ({
        ...r,
        successRate: getSuccessRate(r),
      })) as RecipeStats[];
      setRecipes(withRates);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = recipes;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.recipeId.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => {
        const rate = r.successRate ?? 0;
        const status = getStatus(rate);
        return status === statusFilter;
      });
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return dir * a.recipeId.localeCompare(b.recipeId);
        case "totalApplications":
          return dir * (a.totalApplications - b.totalApplications);
        case "successCount":
          return dir * (a.successCount - b.successCount);
        case "failureCount":
          return dir * (a.failureCount - b.failureCount);
        case "successRate":
          return dir * ((a.successRate as number) - (b.successRate as number));
        default:
          return 0;
      }
    });
    return list;
  }, [recipes, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
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
      <h1 className="text-lg font-semibold text-slate-800">Recipes ({filtered.length})</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#D33833]/30 focus:border-[#D33833]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D33833]/30"
        >
          <option value="all">All Statuses</option>
          <option value="healthy">Healthy (≥80%)</option>
          <option value="needs-attention">Needs Attention (50-79%)</option>
          <option value="critical">Critical (&lt;50%)</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortHeader label="Recipe Name" col="name" />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <SortHeader label="Total" col="totalApplications" />
              <SortHeader label="Success" col="successCount" />
              <SortHeader label="Failures" col="failureCount" />
              <SortHeader label="Success Rate" col="successRate" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((r) => {
              const rate = r.successRate as number;
              const status = getStatus(rate);
              return (
                <tr key={r.recipeId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/recipe/${encodeURIComponent(r.recipeId)}`}
                      className="text-sm font-mono text-blue-600 hover:underline"
                    >
                      {shortRecipeName(r.recipeId)}
                    </Link>
                    <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
                      {r.recipeId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === "healthy"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "needs-attention"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {status === "healthy"
                        ? "Healthy"
                        : status === "needs-attention"
                        ? "Needs Attention"
                        : "Critical"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">
                    {r.totalApplications}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600">
                    {r.successCount}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-red-600">
                    {r.failureCount || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            rate >= 80
                              ? "bg-emerald-500"
                              : rate >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-slate-600">
                        {rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No recipes match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Showing {page * PAGE_SIZE + 1}\u2013
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
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
              const p =
                totalPages <= 7
                  ? i
                  : page <= 3
                  ? i
                  : page >= totalPages - 4
                  ? totalPages - 7 + i
                  : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded border ${
                    page === p
                      ? "bg-[#D33833] text-white border-[#D33833]"
                      : "border-slate-300 hover:bg-slate-100"
                  }`}
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