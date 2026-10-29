import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  History,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import InfoModal from "./InfoModal";
import { downloadCsv, downloadJson } from "./lib/download";
import { formatDate, formatNumber, normalizeRisk, riskLabelKey, riskMeta } from "./lib/format";

const CSV_FIELDS = [
  "id",
  "created_at",
  "station_name",
  "station_region",
  "risk_level",
  "risk_score",
  "forecast_1h",
  "forecast_2h",
  "forecast_3h",
  "status",
  "processed_by",
];

function isApproved(row) {
  return ["published", "approved", "processed"].includes(String(row.status || "").toLowerCase());
}

export default function OperatorLogs({ logs = [], loading = false, onRefresh, t, lang = "en" }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      if (filter === "published" && !isApproved(item)) return false;
      if (filter === "declined" && status !== "declined") return false;
      if (!q) return true;
      return `${item.station_name || ""} ${item.station_region || ""} ${item.processed_by || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [logs, filter, query]);

  const downloadStamp = new Date().toISOString().slice(0, 10);

  const selectedRisk = selected ? normalizeRisk(selected.risk_level) : "low";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("alerts.log")}</h1>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{t("alerts.logSub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", key: "common.all" },
            { id: "published", key: "alerts.published" },
            { id: "declined", key: "alerts.declined" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                filter === item.id
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t(item.key)}
            </button>
          ))}
          <button
            type="button"
            onClick={onRefresh}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label={t("common.refresh")}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("logs.search")}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <span className="text-[10px] text-slate-400">
          {t("logs.records")}: {rows.length}
        </span>
        <button
          type="button"
          onClick={() => downloadCsv(`saqta-logs-${downloadStamp}.csv`, CSV_FIELDS, rows)}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {t("logs.download")} CSV
        </button>
        <button
          type="button"
          onClick={() => downloadJson(`saqta-logs-${downloadStamp}.json`, rows)}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <History className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            {query ? t("header.noResults") : t("alerts.noLogs")}
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:grid">
            <span>{t("alerts.station")}</span>
            <span>{t("alerts.region")}</span>
            <span>{t("alerts.risk")}</span>
            <span>{t("alerts.status")}</span>
            <span>{t("alerts.processedBy")}</span>
          </div>
          {rows.map((row) => {
            const approved = isApproved(row);
            const risk = normalizeRisk(row.risk_level);
            const meta = riskMeta(risk);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className="grid w-full grid-cols-1 gap-1.5 border-b border-slate-50 px-4 py-3 text-left text-[10px] transition last:border-0 hover:bg-slate-50/70 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] sm:items-center sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-700">{row.station_name || `#${row.station_id}`}</p>
                  <p className="text-[9px] text-slate-400">{formatDate(row.created_at, lang)}</p>
                </div>
                <span className="truncate text-slate-500">{row.station_region || "—"}</span>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${meta.badge}`}>
                  <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                  {t(riskLabelKey(risk))}
                </span>
                <span
                  className={`inline-flex w-fit items-center gap-1 text-[9px] font-semibold ${
                    approved ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {approved ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {approved ? t("alerts.published") : t("alerts.declined")}
                </span>
                <span className="truncate text-slate-500">{row.processed_by || "—"}</span>
              </button>
            );
          })}
        </div>
      )}

      <InfoModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.station_name || `#${selected?.station_id}`}
        subtitle={
          selected
            ? `${selected.station_region || "—"} · ${formatDate(selected.created_at, lang, { time: true })}`
            : undefined
        }
        t={t}
      >
        {selected && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${riskMeta(selectedRisk).badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${riskMeta(selectedRisk).dot}`} />
                {t(riskLabelKey(selectedRisk))}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  isApproved(selected) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {isApproved(selected) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {isApproved(selected) ? t("alerts.published") : t("alerts.declined")}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {t("station.riskScore")} {formatNumber(selected.risk_score, 0)}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                [t("alerts.region"), selected.station_region || "—"],
                [t("alerts.processedBy"), selected.processed_by || "—"],
                [t("alerts.station"), selected.station_name || `#${selected.station_id}`],
                [t("alerts.status"), isApproved(selected) ? t("alerts.published") : t("alerts.declined")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-1 truncate text-[12px] font-bold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                [t("station.forecast1h"), selected.forecast_1h],
                [t("station.forecast2h"), selected.forecast_2h],
                [t("station.forecast3h"), selected.forecast_3h],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-white p-2 text-center">
                  <p className="text-[9px] text-slate-400">{label}</p>
                  <p className="mt-0.5 text-[12px] font-bold text-slate-700">
                    {formatNumber(value, 0)}{" "}
                    <span className="text-[9px] font-normal text-slate-400">{t("common.cm")}</span>
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 rounded-xl border border-slate-100 p-3 text-[11px] leading-5 text-slate-600">
              {selected.explanation || t("common.none")}
            </p>
          </>
        )}
      </InfoModal>
    </div>
  );
}
