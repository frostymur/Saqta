import React, { useState, useEffect } from "react";
import { Droplets, Compass, ShieldCheck, MapPin } from "lucide-react";
import { KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function RiverGauges({ selectedRegionId }) {
  const defaultRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId) || KAZAKHSTAN_REGIONS[0];
  const [activeRegion, setActiveRegion] = useState(defaultRegion);

  useEffect(() => {
    const found = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId);
    if (found) setActiveRegion(found);
  }, [selectedRegionId]);

  return (
    <section id="gauges-section" className="py-14 px-4 sm:px-8 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              Каскад гидроузлов и речных створов
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Замеры на гидропостах: {activeRegion.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {activeRegion.riverBasin}. Непрерывный контроль притока, сброса плотин и запаса высоты защитных дамб.
            </p>
          </div>

          {/* Quick Region Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {KAZAKHSTAN_REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRegion(r)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap ${
                  activeRegion.id === r.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {r.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Visual River Safety Margin Bar (for cities with dams) */}
        {activeRegion.damSafety && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Запас высоты защитной дамбы ({activeRegion.shortName})</span>
              </div>
              <div className="text-xs text-emerald-900 font-mono font-bold bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md">
                Безопасный запас: {activeRegion.damSafety.margin} см
              </div>
            </div>

            {/* Graphical level bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-river-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(95, Math.max(15, (activeRegion.damSafety.current / activeRegion.damSafety.dam) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>0 см (дно)</span>
                <span className="font-bold text-slate-800">Текущий уровень: {activeRegion.damSafety.current} см</span>
                <span className="text-amber-800 font-semibold">Опасный порог дороги: {activeRegion.damSafety.road} см</span>
                <span className="text-emerald-800 font-bold">Гребень дамбы: {activeRegion.damSafety.dam} см</span>
              </div>
            </div>
          </div>
        )}

        {/* Regional Gauges Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeRegion.gauges.map((p, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.statusBadge}`}>
                    {p.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1">
                  {p.name}
                </h3>
                <div className="text-[11px] text-slate-500 mb-3">{p.tag}</div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {p.level}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{p.levelNote}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
