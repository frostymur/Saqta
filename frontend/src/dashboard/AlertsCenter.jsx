import React, { useMemo, useState } from "react";
import { BellRing, MapPin, Send, Waves } from "lucide-react";
import { formatDate, normalizeRisk, riskLabelKey, riskMeta } from "./lib/format";

const FILTERS = [
  { id: "all", key: "common.all" },
  { id: "high", key: "alerts.riskHigh" },
  { id: "medium", key: "alerts.riskMedium" },
  { id: "low", key: "alerts.riskLow" },
];

export function ViewHeader({ title, subtitle, t, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-500 sm:text-xs">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AlertsCenter({
  alerts = [],
  loading = false,
  t,
  lang = "en",
  onSelectAlert,
  onSendTelegram,
  isOperator = false,
}) {
  const [filter, setFilter] = useState("all");
  const [sendingId, setSendingId] = useState(null);

  const filtered = useMemo(() => {
    const list = [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (filter === "all") return list;
    return list.filter((alert) => normalizeRisk(alert.risk_level) === filter);
  }, [alerts, filter]);

  const send = async (alert) => {
    if (!onSendTelegram) return;
    setSendingId(alert.id);
    try {
      await onSendTelegram(alert);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ViewHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} t={t} />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition ${
              filter === item.id
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t(item.key)}
            {item.id !== "all" && (
              <span className="ml-1 opacity-70">
                {alerts.filter((alert) => normalizeRisk(alert.risk_level) === item.id).length}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-400">
          {filtered.length} {t("alerts.count")}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BellRing className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-slate-800">{t("alerts.empty")}</h3>
          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">{t("alerts.emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const risk = normalizeRisk(alert.risk_level);
            const meta = riskMeta(risk);
            return (
              <article
                key={alert.id}
                className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-900/[0.02] ${
                  risk === "high" ? "border-l-[3px] border-l-red-500" : risk === "medium" ? "border-l-[3px] border-l-amber-400" : "border-l-[3px] border-l-emerald-500"
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: meta.hex }}
                      >
                        <Waves className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-[13px] font-bold text-slate-900">{alert.station_name}</h2>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {alert.station_region} · {formatDate(alert.created_at, lang)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {t(riskLabelKey(risk))}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] leading-5 text-slate-600">{alert.explanation}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {[
                      ["+1h", alert.forecast_1h],
                      ["+2h", alert.forecast_2h],
                      ["+3h", alert.forecast_3h],
                    ].map(([label, value]) => (
                      <span
                        key={label}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-semibold text-slate-500"
                      >
                        {label}{" "}
                        <span className="text-slate-800">
                          {Number.isFinite(Number(value)) ? `${Math.round(Number(value))} cm` : "—"}
                        </span>
                      </span>
                    ))}
                    <span className="rounded-lg border border-slate-100 bg-white px-2 py-1 text-[9px] font-semibold text-slate-400">
                      {t("station.riskScore")} {Math.round(Number(alert.risk_score) || 0)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                    <button
                      type="button"
                      onClick={() => onSelectAlert?.(alert)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <MapPin className="h-3 w-3" />
                      {t("alerts.showOnMap")}
                    </button>
                    {isOperator && onSendTelegram && (
                      <button
                        type="button"
                        onClick={() => send(alert)}
                        disabled={sendingId === alert.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-50"
                      >
                        <Send className={`h-3 w-3 ${sendingId === alert.id ? "animate-pulse" : ""}`} />
                        {t("alerts.telegram")}
                      </button>
                    )}
                    {alert.processed_by && (
                      <span className="ml-auto text-[9px] text-slate-400">
                        {t("alerts.processedBy")}: {alert.processed_by}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
