import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  CloudRain,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  SkipForward,
  Waves,
  X,
} from "lucide-react";
import {
  fetchSimulationStatus,
  setSimulationScenario,
  startSimulationLoop,
  stopSimulationLoop,
  triggerSimulationStep,
} from "../api";
import { formatRelative, normalizeRisk, riskLabelKey, riskMeta } from "./lib/format";

const SCENARIOS = [
  { id: "normal", key: "sim.normal", icon: Waves },
  { id: "spring_flood_surge", key: "sim.spring", icon: Activity },
  { id: "dam_spillover_crit", key: "sim.dam", icon: ShieldAlert },
  { id: "heavy_rainfall", key: "sim.rain", icon: CloudRain },
];

function SimulationControls({ t, onToast }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState("normal");
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSimulationStatus()
      .then((data) => {
        if (cancelled || !data) return;
        if (data.scenario) setScenario(data.scenario);
        if (typeof data.is_running === "boolean") setRunning(data.is_running);
      })
      .catch(() => {
        /* demo controls are optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action, label) => {
    setBusy(action);
    try {
      if (action === "scenario") {
        await setSimulationScenario(scenario, 1.0);
        const chosen = SCENARIOS.find((item) => item.id === scenario);
        onToast?.(`${t("sim.applied")}: ${t(chosen?.key || "sim.normal")}`);
      } else if (action === "step") {
        await triggerSimulationStep();
        onToast?.(t("sim.step"));
      } else if (action === "start") {
        await startSimulationLoop(3);
        setRunning(true);
        onToast?.(t("sim.running"));
      } else if (action === "stop") {
        await stopSimulationLoop();
        setRunning(false);
        onToast?.(t("sim.stopped"));
      }
    } catch {
      onToast?.(t("sim.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <RefreshCw className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold text-slate-700">{t("sim.title")}</span>
          <span className="block truncate text-[9px] text-slate-400">{t("sim.subtitle")}</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
            running ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {running ? t("sim.running") : t("sim.stopped")}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {SCENARIOS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenario(item.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[9px] font-semibold transition ${
                    scenario === item.id
                      ? "border-violet-300 bg-violet-50 text-violet-700"
                      : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t(item.key)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run("scenario")}
              className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[9px] font-semibold text-white disabled:opacity-50"
            >
              {t("sim.scenario")}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run("step")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 disabled:opacity-50"
            >
              <SkipForward className="h-3 w-3" /> {t("sim.step")}
            </button>
            {running ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("stop")}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[9px] font-semibold text-red-600 disabled:opacity-50"
              >
                <Pause className="h-3 w-3" /> {t("sim.stop")}
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("start")}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-700 disabled:opacity-50"
              >
                <Play className="h-3 w-3" /> {t("sim.start")}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function OperatorQueue({
  pending = [],
  onDecide,
  busyIds,
  onSelectAlert,
  onToast,
  t,
  lang = "en",
}) {
  const sorted = useMemo(
    () =>
      [...pending].sort((a, b) => {
        const risk = (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0);
        if (risk !== 0) return risk;
        return new Date(b.created_at) - new Date(a.created_at);
      }),
    [pending]
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("alerts.queue")}</h1>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{t("alerts.queueSub")}</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
          {sorted.length} {t("alerts.pending").toLowerCase()}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-slate-800">{t("alerts.noPending")}</h3>
          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">{t("alerts.noPendingDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => {
            const risk = normalizeRisk(alert.risk_level);
            const meta = riskMeta(risk);
            const busy = busyIds?.has?.(alert.id);
            return (
              <article
                key={alert.id}
                className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5 ${
                  risk === "high" ? "ring-1 ring-red-100" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <h2 className="truncate text-[13px] font-bold text-slate-900">{alert.station_name}</h2>
                      <span className={`hidden rounded-full border px-2 py-0.5 text-[9px] font-bold sm:inline-flex ${meta.badge}`}>
                        {t(riskLabelKey(risk))}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {alert.station_region} · {formatRelative(alert.created_at, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-500">
                      {t("station.riskScore")} {Math.round(Number(alert.risk_score) || 0)}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold sm:hidden ${meta.badge}`}>
                      {t(riskLabelKey(risk))}
                    </span>
                  </div>
                </div>

                <p className="mt-2.5 line-clamp-2 text-[11px] leading-5 text-slate-600">{alert.explanation}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {[
                    ["+1h", alert.forecast_1h],
                    ["+2h", alert.forecast_2h],
                    ["+3h", alert.forecast_3h],
                  ].map(([label, value]) => (
                    <span
                      key={label}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1 text-[9px] font-semibold text-slate-500"
                    >
                      {label}{" "}
                      <span className="text-slate-800">
                        {Number.isFinite(Number(value)) ? `${Math.round(Number(value))} cm` : "—"}
                      </span>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => onSelectAlert?.(alert)}
                    className="ml-auto inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 hover:underline"
                  >
                    <MapPin className="h-3 w-3" />
                    {t("alerts.showOnMap")}
                  </button>
                </div>

                <div className="mt-3 flex gap-2 border-t border-slate-50 pt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecide?.(alert, "approve")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {busy ? t("alerts.processing") : t("alerts.approve")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecide?.(alert, "decline")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("alerts.decline")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SimulationControls t={t} onToast={onToast} />
    </div>
  );
}
