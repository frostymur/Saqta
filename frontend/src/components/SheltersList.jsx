import React, { useState, useEffect } from "react";
import { Building2, PhoneCall, MapPin, Shield } from "lucide-react";
import { KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function SheltersList({ selectedRegionId }) {
  const defaultRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId) || KAZAKHSTAN_REGIONS[0];
  const [activeRegion, setActiveRegion] = useState(defaultRegion);

  useEffect(() => {
    const found = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId);
    if (found) setActiveRegion(found);
  }, [selectedRegionId]);

  return (
    <section id="shelters-section" className="py-14 px-4 sm:px-8 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Безопасное размещение граждан
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Пункты временного размещения (ПВР): {activeRegion.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Действующие эвакуационные пункты с горячим питанием, спальными местами и круглосуточным дежурством медиков:
            </p>
          </div>

          {/* Quick city switcher */}
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

        {/* Shelters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {activeRegion.shelters.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {s.name}
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                    {s.capacity}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{s.address}</span>
                </div>

                <div className="text-xs text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg mb-4">
                  {s.features}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={`tel:${s.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Дежурный комендант: {s.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance Banner */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>
            <strong>Государственная гарантия:</strong> Размещение, трехразовое горячее питание и медицинская помощь во всех пунктах временного размещения предоставляются <strong>бесплатно за счет государственного резерва Республики Казахстан</strong>.
          </span>
        </div>
      </div>
    </section>
  );
}
