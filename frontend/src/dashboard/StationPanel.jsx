import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  BrainCircuit,
  Building2,
  Clock,
  Droplets,
  History,
  Minus,
  Radio,
  RefreshCw,
  X,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchAlerts,
  fetchStationPrediction,
  fetchStationSeries,
  fetchStationTelemetry,
} from "../api";
import {
  cmToMeters,
  formatChartTick,
  formatDate,
  formatNumber,
  formatRelative,
  healthLabelKey,
  healthMeta,
  normalizeHealth,
  normalizeRisk,
  riskLabelKey,
  riskMeta,
  stationRisk,
} from "./lib/format";

const RANGES = [
  { id: "24h", key: "station.range24" },
  { id: "7d", key: "station.range7" },
  { id: "30d", key: "station.range30" },
];

function ChartTooltip({ active, payload, t, lang }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium text-slate-400">{formatDate(point.timestamp, lang)}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">
        {formatNumber(point.water_level, 0)} <span className="text-[10px] font-medium text-slate-400">{t("common.cm")}</span>
      </p>
      {Number.isFinite(Number(point.rate_of_rise)) && (
        <p className="text-[10px] text-slate-500">
          {formatNumber(point.rate_of_rise, 1)} {t("common.perHour")}
        </p>
      )}
    </div>
  );
}

function MetricCard({ label, children, tone = "default" }) {
  const tones = {
    default: "border-slate-100",
    danger: "border-red-100 bg-red-50/40",
    safe: "border-emerald-100 bg-emerald-50/30",
    warn: "border-amber-100 bg-amber-50/30",
  };
  return (
    <div className={`min-w-0 rounded-xl border p-2.5 ${tones[tone] || tones.default}`}>
      <p className="min-h-[2.2em] text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}


function StationJournal({ stationId, t, lang }) {
  const [tab, setTab] = useState("data");
  const [records, setRecords] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!stationId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchStationTelemetry(stationId, 720).catch(() => []),
      fetchAlerts({ stationId, auth: true, limit: 20 }).catch(() => []),
    ])
      .then(([telemetry, alerts]) => {
        if (cancelled) return;
        const list = Array.isArray(telemetry) ? telemetry : [];
        setRecords(list.slice(-12).reverse());
        setEvents(Array.isArray(alerts) ? alerts : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId, nonce]);

  const rows = tab === "data" ? records : events;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-900/[0.02]">
      <div className="mb-2 flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <h3 className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-700">
          {t("station.logTitle")}
        </h3>
        <button
          type="button"
          onClick={() => setNonce((value) => value + 1)}
          title={t("common.refresh")}
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="mb-2 flex rounded-lg bg-slate-100 p-0.5">
        {[
          ["data", "station.logData"],
          ["events", "station.logEvents"],
        ].map(([id, key]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md px-2 py-1 text-[9px] font-bold transition ${
              tab === id ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-2 text-center text-[10px] text-slate-400">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="py-2 text-center text-[10px] text-slate-400">{t("station.logEmpty")}</p>
      ) : tab === "data" ? (
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr] gap-1 bg-slate-50 px-2 py-1 text-[8px] font-bold uppercase text-slate-400">
            <span>{t("station.logTime")}</span>
            <span>{t("station.logLevel")}</span>
            <span>{t("station.logRate")}</span>
            <span>{t("station.logRain")}</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr] gap-1 border-t border-slate-50 px-2 py-1 text-[9px] text-slate-600"
            >
              <span className="truncate text-slate-400">{formatDate(row.timestamp, lang, { time: true })}</span>
              <span className="font-semibold">{formatNumber(row.water_level, 0)}</span>
              <span>{formatNumber(row.rate_of_rise, 1)}</span>
              <span>{formatNumber(row.rainfall, 1)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] gap-1 bg-slate-50 px-2 py-1 text-[8px] font-bold uppercase text-slate-400">
            <span>{t("station.logTime")}</span>
            <span>{t("alerts.risk")}</span>
            <span>{t("alerts.status")}</span>
            <span>{t("alerts.processedBy")}</span>
          </div>
          {rows.map((row) => {
            const risk = normalizeRisk(row.risk_level);
            const status = String(row.status || "").toLowerCase();
            const approved = ["published", "approved", "processed"].includes(status);
            const declined = ["declined", "rejected"].includes(status);
            return (
              <div
                key={row.id}
                className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] items-center gap-1 border-t border-slate-50 px-2 py-1 text-[9px] text-slate-600"
              >
                <span className="truncate text-slate-400">{formatDate(row.created_at, lang, { time: true })}</span>
                <span className={`w-fit rounded-full border px-1 py-0.5 text-[8px] font-bold ${riskMeta(risk).badge}`}>
                  {t(riskLabelKey(risk))}
                </span>
                <span
                  className={
                    approved ? "text-emerald-600" : declined ? "text-red-600" : "text-amber-600"
                  }
                >
                  {approved
                    ? t("alerts.published")
                    : declined
                    ? t("alerts.declined")
                    : t("alerts.pending")}
                </span>
                <span className="truncate">{row.processed_by || "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function StationPanel({
  station,
  region,
  publicAlerts = [],
  isOperator = false,
  onViewDetails,
  onViewAlerts,
  onClose,
  t,
  lang = "en",
}) {
  const [range, setRange] = useState("24h");
  const [points, setPoints] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [chartNonce, setChartNonce] = useState(0);

  const stationId = station?.id;

  useEffect(() => {
    if (!stationId) {
      setPoints([]);
      return undefined;
    }
    let cancelled = false;
    setChartLoading(true);
    setChartError(null);
    fetchStationSeries(stationId, range)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.points) ? data.points : Array.isArray(data) ? data : [];
        const normalized = list
          .map((point) => ({
            ...point,
            timestamp: point.timestamp,
            ts: new Date(point.timestamp).getTime(),
            water_level: Number(point.water_level),
            rate_of_rise: Number(point.rate_of_rise),
          }))
          .filter((point) => Number.isFinite(point.ts));
        setPoints(normalized);
      })
      .catch((error) => {
        if (cancelled) return;
        setPoints([]);
        setChartError(error?.message || t("station.chartError"));
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId, range, chartNonce, t]);

  useEffect(() => {
    if (!stationId) {
      setPrediction(null);
      return;
    }
    let cancelled = false;
    setPredictionLoading(true);
    setPredictionError(null);
    fetchStationPrediction(stationId)
      .then((data) => {
        if (!cancelled) setPrediction(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setPrediction(null);
          setPredictionError(error?.message || t("station.noPrediction"));
        }
      })
      .finally(() => {
        if (!cancelled) setPredictionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId, t]);

  const liveRisk = useMemo(
    () => normalizeRisk(station?.current_risk_level || (station ? stationRisk(station) : "unknown")),
    [station]
  );
  const meta = riskMeta(liveRisk);
  const health = normalizeHealth(station?.health);
  const healthInfo = healthMeta(health);
  const critLevel = Number(station?.thresholds?.crit_level);
  const warnLevel = Number(station?.thresholds?.warn_level);
  const currentLevel = Number(station?.current_water_level);
  const rate = Number(station?.current_rate_of_rise);
  const aboveCritical = Number.isFinite(currentLevel) && Number.isFinite(critLevel) && currentLevel >= critLevel;

  const latestAlert = useMemo(() => {
    if (!station) return null;
    return (
      publicAlerts
        .filter((alert) => String(alert.station_id) === String(station.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
    );
  }, [publicAlerts, station]);

  if (!station) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Droplets className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-800">{t("station.selectTitle")}</h3>
        <p className="mt-2 max-w-[260px] text-xs leading-5 text-slate-500">{t("station.selectDesc")}</p>
      </div>
    );
  }

  const riskBadge = (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {t(riskLabelKey(liveRisk))}
    </span>
  );

  const healthBadge = (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold ${healthInfo.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${healthInfo.dot}`} />
      {t(healthLabelKey(health))}
    </span>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3.5 lg:px-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: meta.hex }}
          >
            <Droplets className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="truncate text-[13px] font-bold leading-tight text-slate-900">{station.name}</h2>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 xl:hidden"
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              {region?.river || station.region} · {station.region}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {riskBadge}
              {healthBadge}
              {isOperator && prediction?.risk_level && (
                <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-700">
                  ML {t(riskLabelKey(normalizeRisk(prediction.risk_level)))}
                </span>
              )}
              <span className="text-[9px] font-medium text-slate-400">#{station.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3.5 p-4 pb-8">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label={t("station.currentLevel")}>
              <p className="truncate text-lg font-bold leading-none text-slate-900">
                {Number.isFinite(currentLevel) ? formatNumber(currentLevel, 0) : "—"}
                <span className="ml-0.5 text-[10px] font-medium text-slate-400">{t("common.cm")}</span>
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                {Number.isFinite(currentLevel) ? `${cmToMeters(currentLevel)} ${t("common.meters")}` : "—"}
              </p>
              <p
                className={`mt-1 flex items-center gap-0.5 text-[9px] font-semibold ${
                  !Number.isFinite(rate) || rate === 0
                    ? "text-slate-400"
                    : rate > 0
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {!Number.isFinite(rate) || rate === 0 ? (
                  <Minus className="h-2.5 w-2.5" />
                ) : rate > 0 ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                )}
                {Number.isFinite(rate) ? `${formatNumber(Math.abs(rate), 1)} ${t("common.perHour")}` : "—"}
              </p>
            </MetricCard>

            <MetricCard label={t("station.criticalLevel")} tone={aboveCritical ? "danger" : "default"}>
              <p className="truncate text-lg font-bold leading-none text-slate-900">
                {Number.isFinite(critLevel) ? formatNumber(critLevel, 0) : "—"}
                <span className="ml-0.5 text-[10px] font-medium text-slate-400">{t("common.cm")}</span>
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                {Number.isFinite(warnLevel) ? `${t("station.warnLevel")} ${formatNumber(warnLevel, 0)}` : "—"}
              </p>
            </MetricCard>

            <MetricCard
              label={t("station.status")}
              tone={
                aboveCritical
                  ? "danger"
                  : liveRisk === "medium"
                  ? "warn"
                  : liveRisk === "low"
                  ? "safe"
                  : "default"
              }
            >
              <p className="flex items-start gap-1 text-[10px] font-bold leading-tight text-slate-800">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                <span>{t(riskLabelKey(liveRisk))}</span>
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                {aboveCritical ? t("station.aboveCritical") : t("station.belowWarn")}
              </p>
            </MetricCard>
          </div>

          {/* Status banner */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
              aboveCritical
                ? "border-red-100 bg-red-50 text-red-700"
                : liveRisk === "medium"
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : liveRisk === "unknown"
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            <Activity className="h-3.5 w-3.5 shrink-0" />
            <p className="text-[10px] font-semibold">
              {liveRisk === "unknown"
                ? t("common.none")
                : aboveCritical
                ? t("station.aboveCritical")
                : t("station.belowWarn")}
            </p>
            <span className="ml-auto text-[9px] font-medium opacity-70">
              {formatRelative(station.last_updated, lang)}
            </span>
          </div>

          {/* Chart */}
          <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-900/[0.02]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold text-slate-700">{t("station.trend")}</h3>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {RANGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRange(item.id)}
                    className={`rounded-md px-2 py-0.5 text-[9px] font-bold transition ${
                      range === item.id ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {t(item.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[140px] w-full">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-[10px] text-slate-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t("station.loadingChart")}
                </div>
              ) : chartError ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-[10px] text-slate-400">
                  <span>{t("station.chartError")}</span>
                  <button
                    type="button"
                    onClick={() => setChartNonce((value) => value + 1)}
                    className="font-semibold text-emerald-600"
                  >
                    {t("common.retry")}
                  </button>
                </div>
              ) : points.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-[10px] text-slate-400">
                  <Activity className="h-5 w-5 text-slate-200" />
                  {t("station.noChart")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 8, right: 6, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id={`water-gradient-${station.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(value) => formatChartTick(value, range, lang)}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                      height={18}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={34}
                      domain={["auto", "auto"]}
                      tickFormatter={(value) => `${Math.round(value)}`}
                    />
                    <Tooltip content={<ChartTooltip t={t} lang={lang} />} />
                    {Number.isFinite(critLevel) && (
                      <ReferenceLine
                        y={critLevel}
                        stroke="#ef4444"
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{
                          value: `${formatNumber(critLevel, 0)} ${t("common.cm")}`,
                          position: "insideTopRight",
                          fill: "#ef4444",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="water_level"
                      stroke="none"
                      fill={`url(#water-gradient-${station.id})`}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="water_level"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {isOperator && <StationJournal stationId={station.id} t={t} lang={lang} />}

          {/* Public warning */}
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
              <BellRing className="h-3.5 w-3.5 text-red-500" />
              <h3 className="text-[11px] font-bold text-slate-700">{t("station.publicWarning")}</h3>
            </div>
            {latestAlert ? (
              <div className="bg-gradient-to-br from-red-50 to-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-red-100 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
                    {t("alerts.published")}
                  </span>
                  <span className="text-[9px] text-slate-400">{formatRelative(latestAlert.created_at, lang)}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-600">{latestAlert.explanation}</p>
                <button
                  type="button"
                  onClick={onViewAlerts}
                  className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:border-emerald-200"
                >
                  {t("station.viewAllAlerts")} →
                </button>
              </div>
            ) : (
              <div className="p-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Droplets className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-800">{t("station.noWarnings")}</p>
                    <p className="text-[9px] text-emerald-600">{t("alerts.emptyDesc")}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Station info */}
          <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-900/[0.02]">
            <div className="mb-2 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-700">{t("station.info")}</h3>
            </div>
            <dl className="space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{t("station.location")}</dt>
                <dd className="truncate font-medium text-slate-600">{station.region}</dd>
              </div>
              {station.code && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">{t("station.fieldCode")}</dt>
                  <dd className="truncate font-mono text-[9px] text-slate-600">{station.code}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{t("station.coordinates")}</dt>
                <dd className="font-mono text-[9px] text-slate-600">
                  {formatNumber(station.lat, 4)}° N, {formatNumber(station.lng, 4)}° E
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{t("station.lastUpdate")}</dt>
                <dd className="flex items-center gap-1 text-slate-600">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(station.last_updated, lang)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{t("station.signal")}</dt>
                <dd className={`flex items-center gap-1 font-medium ${healthInfo.text}`}>
                  <Radio className="h-2.5 w-2.5" />
                  {t(healthLabelKey(health))}
                </dd>
              </div>
            </dl>
          </section>

          {/* ML forecast */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <BrainCircuit className="h-3.5 w-3.5 text-sky-600" />
              <h3 className="text-[11px] font-bold text-slate-700">{t("station.mlForecast")}</h3>
              {prediction?.risk_score != null && (
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                  {t("station.riskScore")} {Math.round(prediction.risk_score)}
                </span>
              )}
            </div>
            {predictionLoading ? (
              <p className="py-2 text-[10px] text-slate-400">{t("common.loading")}</p>
            ) : predictionError || !prediction ? (
              <p className="py-1 text-[10px] text-slate-400">{t("station.noPrediction")}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    ["+1h", prediction.forecast_1h],
                    ["+2h", prediction.forecast_2h],
                    ["+3h", prediction.forecast_3h],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-center">
                      <p className="text-[8px] font-medium text-slate-400">{label}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-slate-700">
                        {Number.isFinite(Number(value)) ? `${formatNumber(value, 0)}` : "—"}
                        <span className="ml-0.5 text-[8px] font-normal text-slate-400">{t("common.cm")}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                  <span className="truncate">
                    {t("station.model")}: <span className="font-semibold text-slate-600">{prediction.model_type || "ML"}</span>
                  </span>
                  <span className="truncate">{prediction.metrics ? t("station.metrics") : ""}</span>
                </div>
              </>
            )}
          </section>

          <button
            type="button"
            onClick={() => onViewDetails?.(station, prediction)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
          >
            {t("station.viewDetails")}
          </button>
        </div>
      </div>
    </div>
  );
}
