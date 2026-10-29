import React, { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone] || tones.slate}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value ?? "—"}</span>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

export default function OperatorStats({ stats, loading, error, onRefresh, t }) {
  const byRegion = useMemo(() => {
    const raw = stats?.by_region;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item) => ({
        region: item.region || item.name || item.station_region,
        count: Number(item.count ?? item.value ?? item.published ?? 0),
      }));
    }
    return Object.entries(raw).map(([region, count]) => ({ region, count: Number(count) || 0 }));
  }, [stats]);

  const max = Math.max(1, ...byRegion.map((item) => item.count));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("stats.title")}</h1>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{t("stats.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-[11px] font-medium text-red-600">
          {t("stats.loadError")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={BellRing} label={t("stats.total")} value={stats?.total} tone="slate" />
            <StatCard icon={Clock} label={t("stats.pending")} value={stats?.pending} tone="amber" />
            <StatCard icon={CheckCircle2} label={t("stats.published")} value={stats?.published} tone="emerald" />
            <StatCard icon={XCircle} label={t("stats.declined")} value={stats?.declined} tone="slate" />
            <StatCard icon={ShieldAlert} label={t("stats.highRisk")} value={stats?.high_risk_pending} tone="red" />
            <StatCard icon={BarChart3} label={t("stats.last24h")} value={stats?.published_24h} tone="sky" />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
              <h2 className="text-[11px] font-bold text-slate-700">{t("stats.byRegion")}</h2>
            </div>
            {loading && byRegion.length === 0 ? (
              <p className="py-6 text-center text-[10px] text-slate-400">{t("stats.loading")}</p>
            ) : byRegion.length === 0 ? (
              <p className="py-6 text-center text-[10px] text-slate-400">{t("common.none")}</p>
            ) : (
              <div className="space-y-2.5">
                {byRegion
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div key={item.region} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 truncate text-[10px] font-medium text-slate-500">
                        {item.region}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-[10px] font-bold text-slate-700">{item.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
