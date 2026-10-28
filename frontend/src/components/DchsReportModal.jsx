import React, { useState } from "react";
import { X, Printer, Copy, Check, FileText, AlertTriangle, ShieldCheck } from "lucide-react";

export default function DchsReportModal({ bulletin, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!bulletin) return null;

  const handleCopy = () => {
    const text = `
${bulletin.title}
${bulletin.ministry}
Территория: ${bulletin.territory}
Дата формирования: ${bulletin.generated_at}
Статус: ${bulletin.overall_status_label}

ГИДРОПОСТЫ БАССЕЙНА Р. ЕСИЛЬ:
${bulletin.stations.map((s) => `- ${s.name}: ${s.water_level} см (Предупр: ${s.warn_level} см, Крит: ${s.crit_level} см, Прогноз 3ч: ${s.forecast_3h} см, Риск: ${s.risk_level.toUpperCase()})`).join("\n")}

ЗОНЫ ПРИОРИТЕТНОЙ ЭВАКУАЦИИ:
${bulletin.evacuation_priority_zones.map((z) => `• ${z}`).join("\n")}

ОПЕРАТИВНЫЕ РЕКОМЕНДАЦИИ:
${bulletin.operational_recommendations.map((r) => `• ${r}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#10192D] border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Официальная сводка ДЧС СКО
              </h2>
              <p className="text-xs text-slate-400">
                Автоматическая генерация на основе телеметрии и ML-прогноза
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Скопировано!" : "Копировать"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bulletin Document Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs leading-relaxed font-sans">
          {/* Official Letterhead */}
          <div className="text-center border-b border-slate-800 pb-5">
            <div className="text-xs uppercase font-extrabold tracking-widest text-sky-400">
              {bulletin.ministry}
            </div>
            <div className="text-lg font-black text-white mt-1">
              {bulletin.title}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Территория: <strong className="text-slate-200">{bulletin.territory}</strong>
            </div>
            <div className="flex justify-center items-center gap-4 mt-3 text-xs">
              <span className="font-mono text-slate-400">Сформирован: {bulletin.generated_at}</span>
              <span>•</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full border ${
                bulletin.overall_status === 'red' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                bulletin.overall_status === 'yellow' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {bulletin.overall_status_label}
              </span>
            </div>
          </div>

          {/* Meteorological Overview */}
          {bulletin.weather_summary && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Метеорологическая обстановка (СКО)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Температура:</span>{" "}
                  <strong className="text-white font-mono">{bulletin.weather_summary.temperature}°C</strong>
                </div>
                <div>
                  <span className="text-slate-400">Осадки:</span>{" "}
                  <strong className="text-sky-400 font-mono">{bulletin.weather_summary.rainfall} мм/ч</strong>
                </div>
                <div>
                  <span className="text-slate-400">Скорость ветра:</span>{" "}
                  <strong className="text-white font-mono">{bulletin.weather_summary.wind_speed} м/с</strong>
                </div>
                <div>
                  <span className="text-slate-400">Влажность почвы:</span>{" "}
                  <strong className="text-amber-300 font-mono">{bulletin.weather_summary.soil_moisture_estimate}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* Stations Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              2. Гидрологические посты р. Есиль (текущее состояние и прогноз)
            </h4>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Гидропост</th>
                    <th className="py-2.5 px-3">Фактический уровень</th>
                    <th className="py-2.5 px-3">Пороги (Предупр / Крит)</th>
                    <th className="py-2.5 px-3">Динамика</th>
                    <th className="py-2.5 px-3">ML Прогноз (+3ч)</th>
                    <th className="py-2.5 px-3">Статус риска</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {bulletin.stations.map((st) => (
                    <tr key={st.station_id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{st.name}</td>
                      <td className="py-2.5 px-3 font-bold text-sky-400">{st.water_level} см</td>
                      <td className="py-2.5 px-3 text-slate-400">{st.warn_level} / {st.crit_level} см</td>
                      <td className="py-2.5 px-3">
                        <span className={st.rate_of_rise > 0 ? "text-rose-400" : "text-emerald-400"}>
                          {st.rate_of_rise > 0 ? "+" : ""}{st.rate_of_rise} см/ч
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-purple-400">{st.forecast_3h} см</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          st.risk_level === 'high' ? 'bg-rose-500/20 text-rose-300' :
                          st.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {st.risk_level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Evacuation Zones */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              3. Зоны приоритетной эвакуации и инженерной защиты
            </h4>
            <ul className="space-y-1.5 list-disc list-inside bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-slate-300">
              {bulletin.evacuation_priority_zones.map((zone, i) => (
                <li key={i}>{zone}</li>
              ))}
            </ul>
          </div>

          {/* Operational Directives */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              4. Указания и рекомендации оперативному штабу
            </h4>
            <ol className="space-y-1.5 list-decimal list-inside bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-slate-300">
              {bulletin.operational_recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Подготовлено ИС «Saqta.kz» • СКО, Петропавловск</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
