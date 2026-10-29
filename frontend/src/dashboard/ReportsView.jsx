import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  FileText,
  Printer,
  RefreshCw,
  ShieldAlert,
  Waves,
  X,
} from "lucide-react";
import { fetchDchsBulletin } from "../api";
import { formatDate, formatNumber, normalizeRisk, riskLabelKey, riskMeta } from "./lib/format";

function statusTone(status) {
  if (status === "red") return "border-red-200 bg-red-50 text-red-700";
  if (status === "yellow") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function weatherLine(weather) {
  if (!weather) return "—";
  if (typeof weather !== "object") return String(weather);
  return Object.entries(weather)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 6)
    .map(([key, value]) => {
      const label = key.replaceAll("_", " ");
      if (typeof value === "object") return `${label}: ${JSON.stringify(value)}`;
      return `${label}: ${value}`;
    })
    .join(" · ");
}

function BulletinModal({ bulletin, open, onClose, t, lang }) {
  if (!open || !bulletin) return null;
  const stations = Array.isArray(bulletin.stations) ? bulletin.stations : [];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        id="saqta-bulletin-modal"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700">{t("reports.bulletin")}</p>
            <h2 className="truncate text-sm font-bold text-slate-900">{bulletin.title || t("reports.title")}</h2>
            <p className="truncate text-[10px] text-slate-400">{bulletin.ministry}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(bulletin.overall_status)}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {bulletin.overall_status_label || bulletin.overall_status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {t("reports.generated")}: {bulletin.generated_at || "—"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [t("reports.highRiskCount"), bulletin.high_risk_stations_count],
              [t("reports.activeAlerts"), bulletin.active_alerts_count],
              [t("reports.stations"), stations.length],
              [t("reports.overall"), bulletin.overall_status?.toUpperCase()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-bold leading-none text-slate-800">{value ?? "—"}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t("reports.territory")}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600">{bulletin.territory || "—"}</p>
            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500">
              <CloudRain className="mt-0.5 h-3 w-3 shrink-0 text-sky-500" />
              <span>{weatherLine(bulletin.weather_summary)}</span>
            </div>
            {bulletin.data_freshness && (
              <p className="mt-1.5 text-[9px] text-slate-400">
                {t("reports.freshness")}: {bulletin.data_freshness.stations_fresh_60m}/
                {bulletin.data_freshness.stations_total} · {bulletin.data_freshness.source}
              </p>
            )}
          </div>

          <h3 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t("reports.stations")}</h3>
          <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-100">
            <div className="hidden grid-cols-[1.6fr_0.6fr_0.7fr_0.6fr] gap-2 bg-slate-50 px-3 py-1.5 text-[8px] font-bold uppercase text-slate-400 sm:grid">
              <span>{t("alerts.station")}</span>
              <span>{t("reports.stationLevel")}</span>
              <span>{t("station.criticalLevel")}</span>
              <span>{t("reports.risk")}</span>
            </div>
            {stations.map((station) => {
              const risk = normalizeRisk(station.risk_level);
              return (
                <div
                  key={station.station_id}
                  className="grid grid-cols-2 gap-1 border-b border-slate-50 px-3 py-2 text-[10px] last:border-0 sm:grid-cols-[1.6fr_0.6fr_0.7fr_0.6fr] sm:items-center sm:gap-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-700">{station.name}</span>
                    <span className="block truncate text-[8px] text-slate-400">{station.region}</span>
                  </span>
                  <span className="font-medium text-slate-600">{formatNumber(station.water_level, 0)} {t("common.cm")}</span>
                  <span className="hidden text-slate-500 sm:block">{formatNumber(station.crit_level, 0)} {t("common.cm")}</span>
                  <span className={`w-fit rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${riskMeta(risk).badge}`}>
                    {t(riskLabelKey(risk))}
                  </span>
                </div>
              );
            })}
          </div>

          {Array.isArray(bulletin.evacuation_priority_zones) && bulletin.evacuation_priority_zones.length > 0 && (
            <>
              <h3 className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-500">
                <ShieldAlert className="h-3 w-3" />
                {t("reports.evacuation")}
              </h3>
              <ul className="mt-1.5 space-y-1">
                {bulletin.evacuation_priority_zones.map((zone) => (
                  <li key={zone} className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-600">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                    {zone}
                  </li>
                ))}
              </ul>
            </>
          )}

          {Array.isArray(bulletin.operational_recommendations) && bulletin.operational_recommendations.length > 0 && (
            <>
              <h3 className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {t("reports.recommendations")}
              </h3>
              <ol className="mt-1.5 space-y-1.5">
                {bulletin.operational_recommendations.map((item, index) => (
                  <li key={item} className="flex gap-2 text-[10px] leading-4 text-slate-600">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[8px] font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <span className="truncate text-[9px] text-slate-400">{formatDate(new Date(), lang)}</span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-3 w-3" />
            {t("reports.print")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsView({
  t,
  lang = "en",
  initialOpen = false,
  regionName = null,
  regionLabel = null,
}) {
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(regionName ? "region" : "national");

  const load = useCallback(
    async ({ showModal = false } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDchsBulletin(scope === "region" ? regionName : null);
        setBulletin(data);
        if (showModal) setOpen(true);
      } catch (err) {
        setError(err?.message || t("reports.error"));
      } finally {
        setLoading(false);
      }
    },
    [t, scope, regionName]
  );

  useEffect(() => {
    load({ showModal: initialOpen });
    // Перезагружаем при смене охвата (РК / регион); кнопка обновления — вручную.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, regionName]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 py-7 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide">
              <Waves className="h-3 w-3" />
              DChS · {t("common.live")}
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{t("reports.title")}</h1>
            <p className="mt-1.5 max-w-lg text-[11px] leading-5 text-emerald-50/85">{t("reports.subtitle")}</p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-[11px] leading-6 text-slate-600">{t("reports.summary")}</p>

          {regionName && (
            <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-0.5">
              {[
                ["national", t("reports.scopeNational")],
                ["region", regionLabel || regionName],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScope(id)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                    scope === id ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (bulletin ? setOpen(true) : load({ showModal: true }))}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {loading ? t("reports.loading") : t("reports.open")}
            </button>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </button>
            <span className="text-[9px] text-slate-400">{t("reports.openHint")}</span>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-medium text-red-600">
              {error}
            </div>
          )}

          {bulletin && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(bulletin.overall_status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {bulletin.overall_status_label || bulletin.overall_status}
                </span>
                <span className="text-[9px] text-slate-400">
                  {t("reports.generated")}: {bulletin.generated_at}
                </span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">{bulletin.territory}</p>
            </div>
          )}
        </div>
      </div>

      <BulletinModal bulletin={bulletin} open={open} onClose={() => setOpen(false)} t={t} lang={lang} />
    </div>
  );
}
