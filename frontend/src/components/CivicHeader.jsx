import React, { useState } from "react";
import { Shield, PhoneCall, Lock, MapPin, ChevronDown } from "lucide-react";
import { KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function CivicHeader({ selectedRegionId, onSelectRegion, onOpenStaff }) {
  const [lang, setLang] = useState("Рус");

  const currentRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-sans">
      {/* Top subtle civic line */}
      <div className="bg-emerald-50/80 border-b border-emerald-100/70 px-4 sm:px-8 py-1.5 text-xs text-emerald-950">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🇰🇿</span>
            <span className="font-medium text-emerald-900">
              Министерство по чрезвычайным ситуациям Республики Казахстан
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 font-bold text-emerald-900 hover:text-emerald-700 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              <span>Единая служба: 112</span>
            </a>
            <span className="text-emerald-200">|</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang("Қаз")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "Қаз" ? "bg-emerald-700 text-white font-bold" : "text-emerald-800 hover:text-emerald-950"
                }`}
              >
                Қаз
              </button>
              <button
                type="button"
                onClick={() => setLang("Рус")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "Рус" ? "bg-emerald-700 text-white font-bold" : "text-emerald-800 hover:text-emerald-950"
                }`}
              >
                Рус
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation row with prominent Regional Selector */}
      <div className="px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    Saqta<span className="text-emerald-700">.kz</span>
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Республика Казахстан
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Единая государственная система мониторинга паводков
                </p>
              </div>
            </a>
          </div>

          {/* Region / City Fast Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Регион:
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onSelectRegion("all")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap ${
                  selectedRegionId === "all"
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🇰🇿 Все регионы
              </button>
              {KAZAKHSTAN_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRegion(r.id)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap ${
                    selectedRegionId === r.id
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {r.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action: Staff link */}
          <div className="hidden lg:flex items-center">
            <button
              type="button"
              onClick={onOpenStaff}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Служебный вход ДЧС</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
