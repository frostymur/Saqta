import React, { useState, useEffect } from "react";
import { MapPin, Bus, ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, Home } from "lucide-react";
import { KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function DistrictCheck({ selectedRegionId, onSelectRegion }) {
  // If national view, pick the first region or keep track of internal region
  const defaultRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId) || KAZAKHSTAN_REGIONS[0];
  const [activeRegion, setActiveRegion] = useState(defaultRegion);

  useEffect(() => {
    const found = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId);
    if (found) {
      setActiveRegion(found);
      if (found.districts.length > 0) {
        setSelectedDistrictId(found.districts[0].id);
      }
    }
  }, [selectedRegionId]);

  const [selectedDistrictId, setSelectedDistrictId] = useState(activeRegion.districts[0]?.id || "");
  const selected = activeRegion.districts.find((d) => d.id === selectedDistrictId) || activeRegion.districts[0];

  return (
    <section id="district-section" className="py-14 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
              <Home className="w-4 h-4 text-emerald-700" />
              Индивидуальная проверка для жителей городов и сел
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Какая обстановка в вашем районе?
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Выберите город или область и нажмите на свой микрорайон, чтобы узнать статус воды, проезд транспорта, дамбы и адреса автобусов эвакуации:
            </p>
          </div>

          {/* City / Region Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs">
            {KAZAKHSTAN_REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveRegion(r);
                  if (r.districts.length > 0) setSelectedDistrictId(r.districts[0].id);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeRegion.id === r.id
                    ? "bg-emerald-700 text-white font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {r.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* District Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          {activeRegion.districts.map((d) => {
            const isSelected = d.id === selectedDistrictId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDistrictId(d.id)}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm"
                    : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-2 h-2 rounded-full ${d.indicator}`} />
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.status === "safe" ? "Безопасно" : d.status === "warning" ? "Внимание" : "ЧС"}
                  </span>
                </div>
                <div className="font-bold text-slate-900 leading-tight">
                  {d.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected District Detailed Briefing Card */}
        {selected && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500 mb-0.5">
                  {activeRegion.name} • {selected.tag}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {selected.name}
                </h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border w-fit ${selected.statusColor}`}>
                {selected.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              {/* Left detail column */}
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">1. Ситуация с водой:</span>
                  <p className="leading-relaxed text-slate-600">{selected.waterState}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-1">2. Состояние дамбы и защитных сооружений:</span>
                  <p className="leading-relaxed text-slate-600">{selected.damState}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-1">3. Проезд транспорта:</span>
                  <p className="leading-relaxed text-slate-600">{selected.transport}</p>
                </div>
              </div>

              {/* Right action column */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1">
                    <Bus className="w-4 h-4 text-emerald-700" />
                    <span>Точка сбора и эвакуационные автобусы:</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed text-xs">
                    {selected.evacPoint}
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-100">
                  <span className="font-bold text-emerald-950 block text-xs mb-1">
                    Ближайший пункт временного размещения (ПВР):
                  </span>
                  <div className="text-slate-900 font-semibold">{selected.shelterName}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <a
                      href={`tel:${selected.shelterPhone}`}
                      className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Дежурный: {selected.shelterPhone}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
