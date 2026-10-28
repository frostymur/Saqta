import React, { useState } from "react";
import { Shield, PhoneCall, Globe, Eye, User, ChevronDown, Check, Waves } from "lucide-react";
import { Button } from "./ui/button";

export default function GovHeader({ currentUser, onOpenAuth, onSelectRole }) {
  const [lang, setLang] = useState("РУС");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full shadow-md font-sans">
      {/* 1. Official Republic of Kazakhstan Top Bar */}
      <div className="bg-[#0A1D30] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-blue-950/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* State Authority Identifier */}
          <div className="flex items-center gap-2.5">
            {/* Kazakhstan Emblem Emblem Mock */}
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[10px] text-amber-300 font-bold">
              🇰🇿
            </div>
            <span className="font-medium text-slate-200 tracking-tight">
              Қазақстан Республикасы Төтенше жағдайлар министрлігі • МЧС РК
            </span>
          </div>

          {/* Right utility strip: eGov links, Emergency Hotline, Accessibility & Language Switcher */}
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://egov.kz"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline hover:text-white transition-colors text-slate-400 font-mono"
            >
              egov.kz
            </a>
            <span className="hidden md:inline text-slate-700">|</span>
            <a
              href="https://gov.kz"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline hover:text-white transition-colors text-slate-400 font-mono"
            >
              gov.kz
            </a>
            <span className="hidden md:inline text-slate-700">|</span>

            {/* Emergency Hotline 112 */}
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Служба спасения: 112</span>
            </div>

            <span className="text-slate-700">|</span>

            {/* Language Switcher QAZ / РУС / ENG */}
            <div className="flex items-center bg-slate-900/80 rounded px-1.5 py-0.5 border border-slate-700 font-mono text-[10px]">
              <button
                onClick={() => setLang("QAZ")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "QAZ" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                QAZ
              </button>
              <button
                onClick={() => setLang("РУС")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "РУС" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                РУС
              </button>
              <button
                onClick={() => setLang("ENG")}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === "ENG" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ENG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar (Gov Deep Navy #0F2942) */}
      <div className="bg-[#0F2942] text-white px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 border border-sky-400/30 flex items-center justify-center shadow-md shadow-sky-950/50">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center">
                  Saqta<span className="text-amber-400">.kz</span>
                </span>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded">
                  СКО • Есіл
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium tracking-tight">
                Единая система мониторинга и прогнозирования паводков
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-200">
            <a href="#map-section" className="hover:text-amber-400 transition-colors">
              Карта гидропостов
            </a>
            <a href="#ml-section" className="hover:text-amber-400 transition-colors">
              ML-прогноз (AI)
            </a>
            <a href="#bulletin-section" className="hover:text-amber-400 transition-colors">
              Сводка ДЧС
            </a>
            <a href="#simulator-section" className="hover:text-amber-400 transition-colors">
              Симулятор волны
            </a>
            <a href="#citizen-section" className="hover:text-amber-400 transition-colors">
              Для граждан
            </a>
          </nav>

          {/* Right: Auth / Role Switcher for Hackathon */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
              >
                <div className={`w-2 h-2 rounded-full ${
                  currentUser.role === 'admin' ? 'bg-purple-400' :
                  currentUser.role === 'operator' ? 'bg-sky-400' : 'bg-emerald-400'
                }`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                    {currentUser.role === 'admin' ? 'Администратор' :
                     currentUser.role === 'operator' ? 'Оператор ДЧС' : 'Гражданский режим'}
                  </div>
                  <div className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {currentUser.full_name}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Role Dropdown */}
              {roleMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="text-[10px] font-bold text-slate-500 px-2.5 py-1 uppercase tracking-wider">
                    Переключение роли (Демо хакатона):
                  </div>
                  <button
                    onClick={() => onSelectRole("guest")}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 ${
                      currentUser.role === "guest" ? "bg-slate-100 font-bold" : ""
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">Гость / Наблюдатель</div>
                      <div className="text-[11px] text-slate-500">Публичный доступ без входа</div>
                    </div>
                    {currentUser.role === "guest" && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => onSelectRole("operator")}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 ${
                      currentUser.role === "operator" ? "bg-slate-100 font-bold" : ""
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sky-700">Оператор ДЧС СКО</div>
                      <div className="text-[11px] text-slate-500">operator@saqta.kz</div>
                    </div>
                    {currentUser.role === "operator" && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                  <button
                    onClick={() => onSelectRole("admin")}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 ${
                      currentUser.role === "admin" ? "bg-slate-100 font-bold" : ""
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-purple-700">Администратор системы</div>
                      <div className="text-[11px] text-slate-500">admin@saqta.kz</div>
                    </div>
                    {currentUser.role === "admin" && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              )}
            </div>

            <Button
              onClick={onOpenAuth}
              variant="default"
              size="sm"
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Войти через ЭЦП</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. National Gold Micro-Accent Border (#F59E0B) */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
    </header>
  );
}
