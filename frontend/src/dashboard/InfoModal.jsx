import React, { useEffect } from "react";
import {
  BrainCircuit,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import {
  formatDate,
  formatNumber,
  healthLabelKey,
  healthMeta,
  normalizeHealth,
  normalizeRisk,
  riskLabelKey,
  riskMeta,
} from "./lib/format";

export default function InfoModal({ open, onClose, title, subtitle, children, t, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[10px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label={t?.("common.close") || "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function FactorsList({ factors }) {
  if (!factors) return null;
  if (Array.isArray(factors)) {
    return (
      <ul className="space-y-1">
        {factors.map((factor, index) => {
          if (typeof factor === "object" && factor !== null) {
            const text =
              factor.name || factor.factor || factor.label || Object.entries(factor).map(([key, value]) => `${key}: ${value}`).join(" · ");
            return (
              <li key={index} className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {text}
              </li>
            );
          }
          return (
            <li key={index} className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-600">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              {String(factor)}
            </li>
          );
        })}
      </ul>
    );
  }
  if (typeof factors === "object") {
    return (
      <dl className="space-y-1">
        {Object.entries(factors).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 text-[10px]">
            <dt className="capitalize text-slate-400">{key.replaceAll("_", " ")}</dt>
            <dd className="font-medium text-slate-600">
              {typeof value === "number" ? formatNumber(value, 2) : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p className="text-[10px] text-slate-600">{String(factors)}</p>;
}

export function StationDetailsModal({ open, onClose, station, prediction, t, lang = "en" }) {
  if (!station) return null;
  const risk = normalizeRisk(station.current_risk_level || prediction?.risk_level);
  const meta = riskMeta(risk);
  const health = normalizeHealth(station.health);
  const healthInfo = healthMeta(health);
  const thresholds = station.thresholds || {};
  const metrics = prediction?.metrics;

  const rows = [
    [t("station.currentLevel"), `${formatNumber(station.current_water_level, 0)} cm`],
    [t("station.warnLevel"), thresholds.warn_level != null ? `${formatNumber(thresholds.warn_level, 0)} cm` : "—"],
    [t("station.criticalLevel"), thresholds.crit_level != null ? `${formatNumber(thresholds.crit_level, 0)} cm` : "—"],
    ["Max rate of rise", thresholds.max_rate_of_rise != null ? `${formatNumber(thresholds.max_rate_of_rise, 1)} cm/h` : "—"],
    [t("station.rateOfRise"), `${formatNumber(station.current_rate_of_rise, 1)} cm/h`],
  ];

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title={station.name}
      subtitle={`${station.region} · #${station.id}`}
      t={t}
      wide
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {t(riskLabelKey(risk))}
        </span>
        {prediction?.risk_score != null && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            {t("station.riskScore")} {Math.round(prediction.risk_score)} / 100
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${healthInfo.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${healthInfo.dot}`} />
          {t(healthLabelKey(health))}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-[12px] font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-slate-400" />
          {formatNumber(station.lat, 4)}° N, {formatNumber(station.lng, 4)}° E
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          {formatDate(station.last_updated, lang)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Droplets className="h-3 w-3 text-slate-400" />
          {station.hazard_type || "flood"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-3.5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-3.5 w-3.5 text-sky-600" />
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-sky-800">{t("station.explanation")}</h3>
          {prediction?.model_type && (
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold text-sky-700">
              {prediction.model_type}
            </span>
          )}
        </div>
        {prediction ? (
          <>
            <p className="mt-2 text-[11px] leading-5 text-slate-600">
              {prediction.explanation || t("common.none")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                [t("station.forecast1h"), prediction.forecast_1h],
                [t("station.forecast2h"), prediction.forecast_2h],
                [t("station.forecast3h"), prediction.forecast_3h],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white p-2 text-center">
                  <p className="text-[8px] text-slate-400">{label}</p>
                  <p className="mt-0.5 text-[12px] font-bold text-slate-700">
                    {formatNumber(value, 0)} <span className="text-[8px] font-normal text-slate-400">{t("common.cm")}</span>
                  </p>
                </div>
              ))}
            </div>
            {prediction.factors && (
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  <TrendingUp className="h-3 w-3" />
                  {t("station.factors")}
                </p>
                <FactorsList factors={prediction.factors} />
              </div>
            )}
            {metrics && (
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  <Gauge className="h-3 w-3" />
                  {t("station.metrics")}
                </p>
                <FactorsList factors={metrics} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-[10px] text-slate-500">{t("station.noPrediction")}</p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 p-3">
        <p className="mb-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
          <ShieldCheck className="h-3 w-3" />
          {t("station.thresholds")}
        </p>
        <FactorsList factors={thresholds} />
      </div>
    </InfoModal>
  );
}
