import React, { useState } from "react";
import { FileText, Printer, Copy, Check, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function DchsBulletinSection({ bulletin }) {
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
${bulletin.stations.map((s) => `- ${s.name}: ${s.water_level} см (Предупр: ${s.warn_level} см, Крит: ${s.crit_level} см, Прогноз 3ч: ${s.forecast_3h} см, Статус: ${s.risk_level.toUpperCase()})`).join("\n")}

ЗОНЫ ПРИОРИТЕТНОЙ ЭВАКУАЦИИ:
${bulletin.evacuation_priority_zones.map((z) => `• ${z}`).join("\n")}

ОПЕРАТИВНЫЕ РЕКОМЕНДАЦИИ:
${bulletin.operational_recommendations.map((r) => `• ${r}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="bulletin-section" className="py-12 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              Государственная отчетность МЧС РК
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Оперативный гидрологический бюллетень ДЧС СКО
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Официальная сводка для комиссии по предупреждению и ликвидации чрезвычайных ситуаций при Акимате Северо-Казахстанской области.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs font-semibold">
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? "Скопировано!" : "Копировать текст"}
            </Button>
            <Button variant="govNavy" size="sm" onClick={handlePrint} className="text-xs font-semibold">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Распечатать форму
            </Button>
          </div>
        </div>

        {/* Official Bulletin Document Card */}
        <Card className="border-slate-300 shadow-sm bg-white overflow-hidden">
          {/* Header Strip */}
          <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
            <div className="text-xs font-extrabold uppercase tracking-widest text-sky-700">
              {bulletin.ministry}
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {bulletin.title}
            </h3>
            <div className="text-xs text-slate-600 mt-1">
              Бассейн реки Есиль • Территория: <strong>{bulletin.territory}</strong>
            </div>

            <div className="flex justify-center items-center gap-4 mt-3 text-xs">
              <span className="font-mono text-slate-500">Сформирован: {bulletin.generated_at}</span>
              <span>•</span>
              <Badge
                variant={
                  bulletin.overall_status === "red"
                    ? "high"
                    : bulletin.overall_status === "yellow"
                    ? "medium"
                    : "low"
                }
              >
                {bulletin.overall_status_label}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Table of Stations */}
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                1. Сводные показатели опорных гидропостов
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Гидропост</th>
                      <th className="py-2.5 px-3">Фактический уровень</th>
                      <th className="py-2.5 px-3">Порог предупреждения</th>
                      <th className="py-2.5 px-3">Критический порог</th>
                      <th className="py-2.5 px-3">Скорость подъема</th>
                      <th className="py-2.5 px-3">ML Прогноз (+3ч)</th>
                      <th className="py-2.5 px-3">Статус МЧС</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {bulletin.stations.map((st) => (
                      <tr key={st.station_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{st.name}</td>
                        <td className="py-2.5 px-3 font-bold text-sky-800">{st.water_level} см</td>
                        <td className="py-2.5 px-3 text-slate-600">{st.warn_level} см</td>
                        <td className="py-2.5 px-3 text-red-600 font-bold">{st.crit_level} см</td>
                        <td className="py-2.5 px-3">
                          <span className={st.rate_of_rise > 0 ? "text-amber-700 font-bold" : "text-emerald-700"}>
                            {st.rate_of_rise > 0 ? "+" : ""}{st.rate_of_rise} см/ч
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-purple-700">{st.forecast_3h} см</td>
                        <td className="py-2.5 px-3 font-sans">
                          <Badge
                            variant={
                              st.risk_level === "high"
                                ? "high"
                                : st.risk_level === "medium"
                                ? "medium"
                                : "low"
                            }
                          >
                            {st.risk_level === "high" ? "Красный код" : st.risk_level === "medium" ? "Желтый код" : "Норма"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Priority Evacuation Zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-red-50/80 border border-red-200">
                <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Зоны первоочередной эвакуации и инженерной защиты:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {bulletin.evacuation_priority_zones.map((zone, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {zone}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Directives */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Предписания оперативному штабу:
                </div>
                <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside">
                  {bulletin.operational_recommendations.map((rec, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
