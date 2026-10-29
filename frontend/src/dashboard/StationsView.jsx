import React, { useMemo, useState } from "react";
import { ArrowUpRight, Droplets, Plus, Search, Waves } from "lucide-react";
import AddStationModal from "./AddStationModal";
import {
  formatNumber,
  formatRelative,
  healthLabelKey,
  healthMeta,
  normalizeRisk,
  riskLabelKey,
  riskMeta,
  stationRisk,
} from "./lib/format";
import { ViewHeader } from "./AlertsCenter";

const FILTERS = [
  { id: "all", key: "common.all" },
  { id: "high", key: "alerts.riskHigh" },
  { id: "medium", key: "alerts.riskMedium" },
  { id: "low", key: "alerts.riskLow" },
];

export default function StationsView({
  stations = [],
  selectedStation,
  onSelectStation,
  region,
  loading,
  isOperator = false,
  onStationCreated,
  onToast,
  t,
  lang = "en",
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...stations]
      .filter((station) => {
        const risk = normalizeRisk(station.current_risk_level || stationRisk(station));
        if (filter !== "all" && risk !== filter) return false;
        if (!q) return true;
        return `${station.name} ${station.region}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const rank = { high: 3, medium: 2, low: 1 };
        const ar = rank[normalizeRisk(a.current_risk_level || stationRisk(a))] || 0;
        const br = rank[normalizeRisk(b.current_risk_level || stationRisk(b))] || 0;
        if (ar !== br) return br - ar;
        return (Number(b.current_water_level) || 0) - (Number(a.current_water_level) || 0);
      });
  }, [stations, filter, query]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ViewHeader
        title={t("nav.stations")}
        subtitle={`${region?.name || ""} · ${t("station.countLabel")}: ${stations.length}`}
        t={t}
        action={
          isOperator && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("station.add")}
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("header.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                filter === item.id
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Waves className="h-8 w-8 text-slate-200" />
          <p className="mt-2 text-[11px] font-semibold text-slate-500">{t("header.noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {list.map((station) => {
            const risk = normalizeRisk(station.current_risk_level || stationRisk(station));
            const meta = riskMeta(risk);
            const selected = selectedStation && String(selectedStation.id) === String(station.id);
            return (
              <button
                key={station.id}
                type="button"
                onClick={() => onSelectStation?.(station)}
                className={`group rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  selected ? "border-emerald-400 ring-2 ring-emerald-500/10" : "border-slate-100"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: meta.hex }}
                  >
                    <Droplets className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-slate-800">{station.name}</p>
                    <p className="truncate text-[9px] text-slate-400">
                      {station.region} · {formatRelative(station.last_updated, lang)}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-emerald-600" />
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[8px] uppercase tracking-wide text-slate-400">{t("station.currentLevel")}</p>
                    <p className="text-lg font-bold leading-tight text-slate-900">
                      {formatNumber(station.current_water_level, 0)}
                      <span className="ml-0.5 text-[9px] font-medium text-slate-400">{t("common.cm")}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-wide text-slate-400">{t("station.criticalLevel")}</p>
                    <p className="text-[12px] font-semibold text-slate-600">
                      {formatNumber(station.thresholds?.crit_level, 0)} {t("common.cm")}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${meta.badge}`}>
                    {t(riskLabelKey(risk))}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-50 pt-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      healthMeta(station.health).dot
                    }`}
                  />
                  <span
                    className={`text-[9px] font-semibold ${
                      healthMeta(station.health).text
                    }`}
                  >
                    {t(healthLabelKey(station.health))}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    · {formatRelative(station.last_updated, lang)}
                  </span>
                  <span className="ml-auto text-[9px] font-semibold text-emerald-700 group-hover:underline">
                    {t("alerts.showOnMap")} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AddStationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        region={region}
        t={t}
        onCreated={onStationCreated}
        onToast={onToast}
      />
    </div>
  );
}
