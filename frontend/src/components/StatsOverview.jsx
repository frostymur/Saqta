import React from "react";
import { AlertTriangle, TrendingUp, Droplets, MapPin, Activity, ShieldCheck } from "lucide-react";

export default function StatsOverview({ stations, alerts, weather }) {
  // Find key stations
  const sergeevka = stations.find((s) => s.name.includes("Сергеевское")) || stations[0];
  const petroBridge = stations.find((s) => s.name.includes("Мост")) || stations[2];
  const zarechny = stations.find((s) => s.name.includes("Заречный")) || stations[3];

  const highRiskCount = stations.filter((s) => s.current_risk_level === "high").length;
  const mediumRiskCount = stations.filter((s) => s.current_risk_level === "medium").length;
  const newAlertsCount = alerts.filter((a) => a.status === "new").length;

  const isCritical = highRiskCount > 0;
  const isWarning = mediumRiskCount > 0 && !isCritical;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      {/* 1. Overall Basin Status */}
      <div className={`rounded-xl p-4 border transition-all ${
        isCritical
          ? "bg-rose-950/40 border-rose-600/50 shadow-lg shadow-rose-950/50"
          : isWarning
          ? "bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/30"
          : "bg-slate-900/60 border-slate-800"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Гидрорежим р. Есиль
          </span>
          {isCritical ? (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          ) : (
            <Activity className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="text-xl font-bold flex items-center gap-2">
          {isCritical ? (
            <span className="text-rose-400">Чрезвычайная угроза</span>
          ) : isWarning ? (
            <span className="text-amber-400">Повышенная готовность</span>
          ) : (
            <span className="text-emerald-400">Штатная норма</span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span>{highRiskCount} крит. гидропостов</span>
          <span className="text-amber-300 font-mono font-medium">{newAlertsCount} активных алертов</span>
        </div>
      </div>

      {/* 2. Сергеевское водохранилище */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            Сергеевское вдхр.
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            Верхний бьеф
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {sergeevka?.current_water_level ?? "---"}
          </span>
          <span className="text-xs text-slate-400 font-mono">см</span>
          {sergeevka?.current_rate_of_rise !== undefined && (
            <span className={`text-xs font-mono font-semibold ${
              sergeevka.current_rate_of_rise > 0 ? "text-rose-400" : "text-emerald-400"
            }`}>
              {sergeevka.current_rate_of_rise > 0 ? "+" : ""}{sergeevka.current_rate_of_rise} см/ч
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-1 flex justify-between">
          <span>Порог гребня: 800 см</span>
          <span className="text-rose-400 font-medium">
            {sergeevka?.current_water_level > 800
              ? `Перелив: +${Math.round(sergeevka.current_water_level - 800)} см`
              : "В чаше"}
          </span>
        </div>
      </div>

      {/* 3. Петропавловск (Мост) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Петропавловск (Мост)
          </span>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
            Городской створ
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {petroBridge?.current_water_level ?? "---"}
          </span>
          <span className="text-xs text-slate-400 font-mono">см</span>
          {petroBridge?.current_rate_of_rise !== undefined && (
            <span className={`text-xs font-mono font-semibold ${
              petroBridge.current_rate_of_rise > 0 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {petroBridge.current_rate_of_rise > 0 ? "+" : ""}{petroBridge.current_rate_of_rise} см/ч
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-1 flex justify-between">
          <span>Предупр: 940 см</span>
          <span className="text-rose-400 font-semibold">Крит: 980 см</span>
        </div>
      </div>

      {/* 4. Поселок Заречный */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Пос. Заречный (Пойма)
          </span>
          <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
            Зона затопления
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {zarechny?.current_water_level ?? "---"}
          </span>
          <span className="text-xs text-slate-400 font-mono">см</span>
          <span className="text-xs font-mono text-rose-400 font-semibold">
            {zarechny?.current_water_level >= (zarechny?.thresholds?.warn_level || 880) ? "ПОЙМА ЗАТОПЛЕНА" : "В русле"}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-1 flex justify-between">
          <span>Предупр: 880 см</span>
          <span className="text-rose-400 font-semibold">Крит: 950 см</span>
        </div>
      </div>
    </div>
  );
}
