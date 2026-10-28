import React, { useState } from "react";
import { Shield, PhoneCall, Lock } from "lucide-react";

export default function CivicHeader({ onOpenStaff }) {
  const [lang, setLang] = useState("Рус");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-sans">
      {/* Top subtle civic line */}
      <div className="bg-emerald-50/80 border-b border-emerald-100/70 px-4 sm:px-8 py-1.5 text-xs text-emerald-950">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🇰🇿</span>
            <span className="font-medium text-emerald-900">
              ДЧС Северо-Казахстанской области • МЧС РК
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

      {/* Main navigation row */}
      <div className="px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Saqta<span className="text-emerald-700">.kz</span>
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Петропавловск
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Оперативная гидрологическая обстановка на р. Есиль
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-700">
            <a href="#district-section" className="hover:text-emerald-700 transition-colors">
              Обстановка по районам
            </a>
            <a href="#gauges-section" className="hover:text-emerald-700 transition-colors">
              Уровень воды
            </a>
            <a href="#actions-section" className="hover:text-emerald-700 transition-colors">
              Что делать жителю
            </a>
            <a href="#shelters-section" className="hover:text-emerald-700 transition-colors">
              Эвакопункты (ПВР)
            </a>
          </nav>

          {/* Right Action: Staff link */}
          <button
            type="button"
            onClick={onOpenStaff}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Служебный вход</span>
          </button>
        </div>
      </div>
    </header>
  );
}
