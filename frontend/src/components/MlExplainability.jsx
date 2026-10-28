import React from "react";
import { Brain, Cpu, AlertCircle, CheckCircle2, TrendingUp, ShieldAlert, Sparkles } from "lucide-react";

export default function MlExplainability({ prediction }) {
  if (!prediction) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-slate-400 text-xs">
        Загрузка данных ML модели прогнозирования...
      </div>
    );
  }

  const {
    risk_level,
    risk_score,
    forecast_1h,
    forecast_2h,
    forecast_3h,
    horizon,
    explanation,
    factors,
    model_type,
    metrics
  } = prediction;

  const isHigh = risk_level === "high";
  const isMedium = risk_level === "medium";

  const badgeColor = isHigh
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : isMedium
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header with Model Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Интеллектуальный прогноз риска (XAI)
                <Sparkles className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {model_type} • Горизонт: {horizon}
              </div>
            </div>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
            {isHigh ? "ВЫСОКИЙ РИСК" : isMedium ? "ПОВЫШЕННЫЙ РИСК" : "НИЗКИЙ РИСК"}
          </span>
        </div>

        {/* Risk Score Progress & Metric */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">Индекс паводковой опасности:</span>
            <span className="font-mono font-bold text-base text-white">
              {risk_score}<span className="text-xs text-slate-400">/100</span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, risk_score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0 (Безопасно)</span>
            <span>40 (Предупреждение)</span>
            <span>70+ (ЧС)</span>
          </div>
        </div>

        {/* Forecast Points Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-400 font-medium">+1 Час</div>
            <div className="text-sm font-bold font-mono text-purple-300">{forecast_1h} см</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-400 font-medium">+2 Часа</div>
            <div className="text-sm font-bold font-mono text-purple-300">{forecast_2h} см</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-400 font-medium">+3 Часа</div>
            <div className="text-sm font-bold font-mono text-purple-300">{forecast_3h} см</div>
          </div>
        </div>

        {/* Human-Readable Explanation */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            Гидрологическое обоснование ML:
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Factor Breakdown (Feature Contributions) */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ключевые факторы влияния:
          </div>
          {factors?.map((f, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-300">{f.name}</span>
                <span className="font-mono font-bold text-sky-400">{f.value}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${Math.round(f.weight * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {Math.round(f.weight * 100)}% вес
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Accuracy Metrics */}
      {metrics && (
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Метрики точности:</span>
          <div className="flex gap-3">
            <span>MAE: <strong className="text-slate-200">{metrics.mae} см</strong></span>
            <span>R²: <strong className="text-emerald-400">{metrics.r2}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
