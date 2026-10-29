import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Gauge,
  History,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { fetchTelemetryLog } from "../api";
import InfoModal from "./InfoModal";
import { downloadCsv, downloadJson } from "./lib/download";
import {
  cmToMeters,
  formatDate,
  formatNumber,
} from "./lib/format";

const RANGES = [
  { id: "24", key: "station.range24" },
  { id: "168", key: "station.range7" },
  { id: "720", key: "station.range30" },
];

const CSV_FIELDS = [
  "id",
  "timestamp",
  "station_name",
  "station_region",
  "water_level",
  "rate_of_rise",
  "rainfall",
  "temperature",
  "soil_moisture",
  "is_valid",
  "error_reason",
];

export default function TelemetryLogs({
  stations = [],
  region,
  t,
  lang = "en",
}) {
  const [stationId, setStationId] = useState("all");
  const [hours, setHours] = useState("24");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setStationId("all");
  }, [region?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTelemetryLog({
      stationId: stationId === "all" ? null : Number(stationId),
      region: region?.name || null,
      hours: Number(hours),
      limit: 1000,
    })
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setRows([]);
        setError(err?.message || t("telemetry.empty"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId, hours, region?.name, nonce, t]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.station_name || ""} ${row.station_region || ""}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const downloadStamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {t("telemetry.title")}
          </h1>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {t("telemetry.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setHours(item.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                hours === item.id
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t(item.key)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setNonce((value) => value + 1)}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label={t("common.refresh")}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-[190px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("telemetry.search")}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <select
          value={stationId}
          onChange={(event) => setStationId(event.target.value)}
          className="h-9 min-w-[160px] rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 outline-none"
        >
          <option value="all">{t("telemetry.allStations")}</option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400">
          {t("logs.records")}: {visible.length}
        </span>
        <button
          type="button"
          onClick={() =>
            downloadCsv(`saqta-telemetry-${downloadStamp}.csv`, CSV_FIELDS, visible)
          }
          disabled={visible.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {t("logs.download")} CSV
        </button>
        <button
          type="button"
          onClick={() => downloadJson(`saqta-telemetry-${downloadStamp}.json`, visible)}
          disabled={visible.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>

      {rows.length >= 1000 && (
        <p className="mb-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">
          {t("telemetry.capped")}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-sm text-slate-400">
          {t("common.loading")}
        </div>
      ) : error || visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <History className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            {query ? t("header.noResults") : t("telemetry.empty")}
          </h3>
          {error && <p className="mt-1 text-[11px] text-slate-400">{error}</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="hidden grid-cols-[1.1fr_2fr_0.7fr_0.75fr_0.75fr_0.65fr_0.8fr] gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:grid">
            <span>{t("station.logTime")}</span>
            <span>{t("alerts.station")}</span>
            <span>{t("station.logLevel")}</span>
            <span>{t("station.logRate")}</span>
            <span>{t("station.logRain")}</span>
            <span>{t("telemetry.temperature")}</span>
            <span>{t("alerts.status")}</span>
          </div>
          {visible.map((row) => {
            const valid = row.is_valid !== false;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className="grid w-full grid-cols-2 gap-1.5 border-b border-slate-50 px-4 py-3 text-left text-[10px] transition last:border-0 hover:bg-slate-50/70 sm:grid-cols-[1.1fr_2fr_0.7fr_0.75fr_0.75fr_0.65fr_0.8fr] sm:items-center sm:gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-700">
                    {formatDate(row.timestamp, lang)}
                  </p>
                  <p className="text-[9px] text-slate-400">#{row.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold leading-4 text-slate-700">
                    {row.station_name || `#${row.station_id}`}
                  </p>
                  <p className="truncate text-[9px] text-slate-400">{row.station_region || "—"}</p>
                </div>
                <span className="font-semibold text-slate-700">
                  {formatNumber(row.water_level, 0)}{" "}
                  <span className="text-[9px] font-normal text-slate-400">{t("common.cm")}</span>
                </span>
                <span className="text-slate-600">
                  {formatNumber(row.rate_of_rise, 1)}{" "}
                  <span className="text-[9px] text-slate-400">{t("common.perHour")}</span>
                </span>
                <span className="text-slate-600">
                  {formatNumber(row.rainfall, 1)}{" "}
                  <span className="text-[9px] text-slate-400">{t("telemetry.rainUnit")}</span>
                </span>
                <span className="text-slate-600">
                  {formatNumber(row.temperature, 1)}
                  <span className="text-[9px] text-slate-400">°C</span>
                </span>
                <span
                  className={`inline-flex w-fit items-center gap-1 text-[9px] font-semibold ${
                    valid ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {valid ? t("station.logValid") : t("telemetry.invalid")}
                </span>
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
            ? `${selected.station_region || "—"} · ${formatDate(selected.timestamp, lang)}`
            : undefined
        }
        t={t}
        wide
      >
        {selected && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  selected.is_valid !== false
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {selected.is_valid !== false ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {selected.is_valid !== false ? t("station.logValid") : t("telemetry.invalid")}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {t("telemetry.record")} #{selected.id}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {[
                [t("station.logLevel"), `${formatNumber(selected.water_level, 0)} ${t("common.cm")}`],
                [`${t("station.logLevel")}, ${t("common.meters")}`, `${cmToMeters(selected.water_level)} ${t("common.meters")}`],
                [t("station.logRate"), `${formatNumber(selected.rate_of_rise, 1)} ${t("common.perHour")}`],
                [t("station.logRain"), `${formatNumber(selected.rainfall, 1)} ${t("telemetry.rainUnit")}`],
                [t("telemetry.temperature"), `${formatNumber(selected.temperature, 1)} °C`],
                [t("telemetry.soil"), `${formatNumber(selected.soil_moisture, 0)} %`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {selected.error_reason && (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-[11px] leading-5 text-red-700">
                {t("telemetry.error")}: {selected.error_reason}
              </p>
            )}
          </>
        )}
      </InfoModal>
    </div>
  );
}
