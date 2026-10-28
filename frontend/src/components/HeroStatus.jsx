import React from "react";
import { Clock, TrendingUp, PhoneCall, ArrowDown, ShieldCheck, MapPin, Compass, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { NATIONAL_OVERVIEW, KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function HeroStatus({ selectedRegionId, selectedRegion, onSelectRegion }) {
  const isNational = selectedRegionId === "all" || !selectedRegion;

  return (
    <section className="bg-gradient-to-b from-emerald-50/40 via-white to-white pt-10 pb-12 px-4 sm:px-8 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Title & Timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {isNational ? "Национальная сводка • Все области и города РК" : selectedRegion.riverBasin}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isNational ? "Паводковая обстановка в Республике Казахстан" : `Паводковая обстановка: ${selectedRegion.name}`}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Обновлено: сегодня, 13:15</span>
          </div>
        </div>

        {/* NATIONAL VIEW (ALL REGIONS) */}
        {isNational ? (
          <div>
            {/* National Summary Banner */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6 mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                  🇰🇿
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                      Республиканский мониторинг • 20 регионов
                    </span>
                    <span className="text-xs text-emerald-800">
                      Все бассейны рек под контролем МЧС РК
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-normal">
                    На особом гидрологическом контроле находятся 4 паводкоопасных региона: <strong>Северо-Казахстанская (Петропавловск)</strong>, <strong>Западно-Казахстанская (Уральск)</strong>, <strong>Костанайская</strong> и <strong>Атырауская области</strong>. В остальных регионах страны гидрологическая обстановка стабильная.
                  </p>
                </div>
              </div>
            </div>

            {/* National Rivers Status Grid */}
            <div className="mb-6">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Обстановка по ключевым речным бассейнам Казахстана:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {NATIONAL_OVERVIEW.riversOverview.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{item.river}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.statusBadge}`}>
                          {item.status.includes("Желтый") ? "Внимание" : "Норма"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{item.regions}</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.status}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      {item.river.includes("Есиль") && (
                        <button
                          type="button"
                          onClick={() => onSelectRegion("sko")}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          Перейти к Петропавловску и СКО →
                        </button>
                      )}
                      {item.river.includes("Жайык") && (
                        <button
                          type="button"
                          onClick={() => onSelectRegion("zko")}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          Перейти к Уральску и ЗКО →
                        </button>
                      )}
                      {item.river.includes("Тобол") && (
                        <button
                          type="button"
                          onClick={() => onSelectRegion("kostanay")}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          Перейти к Костанаю →
                        </button>
                      )}
                      {item.river.includes("Илек") && (
                        <button
                          type="button"
                          onClick={() => onSelectRegion("aktobe")}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          Перейти к Актобе →
                        </button>
                      )}
                      {!item.river.includes("Есиль") && !item.river.includes("Жайык") && !item.river.includes("Тобол") && !item.river.includes("Илек") && (
                        <span className="text-[11px] text-slate-400">Штатный гидрологический режим</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* LOCAL CITY / REGIONAL VIEW */
          <div>
            {/* Status Banner for the specific city */}
            <div className={`rounded-2xl border p-5 sm:p-6 mb-8 shadow-sm ${
              selectedRegion.status === "warning" ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm ${
                  selectedRegion.status === "warning" ? "bg-amber-500" : "bg-emerald-600"
                }`}>
                  {selectedRegion.status === "warning" ? "▲" : "✓"}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      selectedRegion.status === "warning" ? "text-amber-900 bg-amber-100 border-amber-200" : "text-emerald-900 bg-emerald-100 border-emerald-200"
                    }`}>
                      {selectedRegion.statusLabel}
                    </span>
                    <span className="text-xs text-slate-700">
                      {selectedRegion.dchsName}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-normal">
                    {selectedRegion.statusDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 City Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {selectedRegion.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors"
                >
                  <div className="text-xs text-slate-500 mb-2 font-semibold">
                    {m.label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">{m.value}</span>
                    <span className="text-sm font-semibold text-slate-500">{m.unit}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {m.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a href="#district-section">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-4 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
              {isNational ? "Проверить районы и населенные пункты" : `Обстановка по районам: ${selectedRegion.shortName}`}
            </Button>
          </a>

          <a href="#actions-section">
            <Button variant="outline" className="text-xs font-semibold text-slate-700 border-slate-300 bg-white">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              Памятка населению при паводке
            </Button>
          </a>

          <a href="tel:112" className="ml-auto">
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs font-bold py-2 px-4 shadow-sm">
              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
              Служба 112 (экстренно)
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
