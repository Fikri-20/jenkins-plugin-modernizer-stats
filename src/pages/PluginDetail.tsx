import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { loadMigrations, loadPlugins } from "../utils/data";
import { StatusBadge } from "../components/StatusBadge";
import type { MigrationRecord, PluginSummary } from "../types";

export function PluginDetail() {
  const { name } = useParams<{ name: string }>();
  const [migrations, setMigrations] = useState<MigrationRecord[]>([]);
  const [summary, setSummary] = useState<PluginSummary | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!name) return;
    loadMigrations().then((all) =>
      setMigrations(all.filter((m) => m.pluginName === name).sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? "")))
    );
    loadPlugins().then((all) => setSummary(all.find((p) => p.name === name) ?? null));
  }, [name]);

  if (!summary && migrations.length === 0) {
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const statusColor: Record<string, string> = {
    success: "border-emerald-400 bg-emerald-50",
    fail: "border-red-400 bg-red-50",
    skipped: "border-slate-300 bg-slate-50",
    "dry-run": "border-blue-300 bg-blue-50",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/plugins" className="text-sm text-slate-500 hover:text-slate-700">
            ← Plugins
          </Link>
          <h1 className="text-2xl font-bold font-mono text-slate-800 mt-1">{name}</h1>
          {summary?.repository && (
            <a
              href={summary.repository}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {summary.repository.replace("https://github.com/", "")}
            </a>
          )}
        </div>
        {summary && <StatusBadge status={summary.status} className="mt-7 shrink-0" />}
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniCard label="Total Migrations" value={summary.totalMigrations} />
          <MiniCard label="Successful" value={summary.successCount} color="text-emerald-600" />
          <MiniCard label="Failed" value={summary.failCount} color="text-red-600" />
          <MiniCard label="Open PRs" value={summary.openPRs} color="text-orange-600" />
        </div>
      )}

      {/* Migration timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Migration Timeline ({migrations.length})
        </h2>
        <div className="space-y-3">
          {migrations.map((m) => {
            const key = m.key ?? m.timestamp ?? Math.random().toString();
            const isExpanded = expanded.has(key);
            const hasChecks = m.checkRuns && Object.keys(m.checkRuns).length > 0;

            return (
              <div
                key={key}
                className={`border-l-4 rounded-r-lg p-4 ${statusColor[m.migrationStatus] ?? "border-slate-300 bg-slate-50"}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">
                      {shortRecipeName(m.migrationId)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m.timestamp ? formatDate(m.timestamp) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <MigrationStatusPill status={m.migrationStatus} />
                    {m.pullRequestUrl && (
                      <a
                        href={m.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-mono"
                      >
                        PR {prStatusPill(m.pullRequestStatus)}
                      </a>
                    )}
                  </div>
                </div>

                {/* Diff stats + tags */}
                <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-slate-600">
                  {(m.additions !== undefined || m.deletions !== undefined) && (
                    <span className="font-mono">
                      <span className="text-emerald-600">+{m.additions ?? 0}</span>{" "}
                      <span className="text-red-600">−{m.deletions ?? 0}</span>{" "}
                      <span className="text-slate-400">({m.changedFiles ?? 0} files)</span>
                    </span>
                  )}
                  {m.tags?.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-white/70 border border-slate-200 rounded font-mono text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Check runs (collapsible) */}
                {hasChecks && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleExpanded(key)}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                      CI checks ({Object.keys(m.checkRuns!).length})
                      {m.checkRunsSummary === "failure" && (
                        <span className="ml-1 px-1 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">failing</span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(m.checkRuns!).map(([check, result]) => (
                          <div key={check} className="flex items-center gap-2 text-xs">
                            <span className={result === "success" ? "text-emerald-600" : "text-red-500"}>
                              {result === "success" ? "✓" : "✗"}
                            </span>
                            <span className="text-slate-600 font-mono truncate">{check}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {migrations.length === 0 && (
            <p className="text-sm text-slate-400">No migrations recorded for this plugin.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, color = "text-slate-800" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold font-mono mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function MigrationStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    fail: "bg-red-100 text-red-800",
    skipped: "bg-slate-100 text-slate-600",
    "dry-run": "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function prStatusPill(status?: string | null) {
  if (!status) return "";
  const styles: Record<string, string> = {
    open: "text-orange-600",
    merged: "text-purple-600",
    closed: "text-slate-500",
  };
  return <span className={`font-mono text-xs ${styles[status] ?? ""}`}>({status})</span>;
}

function shortRecipeName(id: string): string {
  const name = id.split(".").pop() ?? id;
  return name.replace(/([A-Z])/g, " $1").trim();
}

function formatDate(ts: string): string {
  const clean = ts.replace(/T(\d{2})-(\d{2})-(\d{2})$/, "T$1:$2:$3");
  const d = new Date(clean);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
