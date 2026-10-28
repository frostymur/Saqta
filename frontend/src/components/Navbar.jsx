import React from "react";
import { Waves, ShieldAlert, CloudRain, Thermometer, Radio, FileText, UserCheck, LogOut, ChevronDown } from "lucide-react";

export default function Navbar({
  currentUser,
  onOpenLogin,
  onOpenReport,
  onLogout,
  weather,
  wsConnected,
  onSelectRole
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 lg:px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Government Authority */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center">
                Saqta<span className="text-sky-400">.kz</span>
              </span>
              <span className="bg-sky-500/20 text-sky-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                ДЧС СКО
              </span>
              <span className="hidden sm:inline-block bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Мониторинг и прогнозирование паводков р. Есиль (Петропавловск)
            </p>
          </div>
        </div>

        {/* Center: Live Meteorological & River Basin Context */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span className="text-slate-400">Поток данных:</span>
            <span className={wsConnected ? "text-emerald-400 font-medium font-mono" : "text-amber-400 font-medium"}>
              {wsConnected ? "LIVE WebSocket" : "Подключение..."}
            </span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {weather && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300" title="Температура воздуха">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold font-mono">{weather.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300" title="Интенсивность осадков">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold font-mono">{weather.rainfall} мм/ч</span>
              </div>
              {weather.is_snowmelting && (
                <span className="bg-amber-500/15 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30">
                  Активное снеготаяние
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User Auth Role Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500/50 text-xs font-semibold px-3 py-2 rounded-lg transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Сводка ДЧС</span>
          </button>

          {/* Role selector dropdown / Quick login for hackathon demo */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs rounded-lg px-3 py-1.5 cursor-pointer">
              <div className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin' ? 'bg-purple-400' :
                currentUser.role === 'operator' ? 'bg-sky-400' : 'bg-emerald-400'
              }`} />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                  {currentUser.role === 'admin' ? 'Администратор' :
                   currentUser.role === 'operator' ? 'Оператор ДЧС' : 'Наблюдатель'}
                </div>
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {currentUser.full_name.split(' ')[0]}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </div>

            {/* Role quick switch popup */}
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#131C31] border border-slate-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                Быстрая смена роли (Демо):
              </div>
              <button
                onClick={() => onSelectRole('guest')}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                  currentUser.role === 'guest' ? 'bg-slate-800 font-bold text-white' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-emerald-400">Гость / Наблюдатель</div>
                  <div className="text-[11px] text-slate-400">Публичный мониторинг</div>
                </div>
                {currentUser.role === 'guest' && <UserCheck className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => onSelectRole('operator')}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                  currentUser.role === 'operator' ? 'bg-slate-800 font-bold text-white' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-sky-400">Оператор ДЧС</div>
                  <div className="text-[11px] text-slate-400">operator@saqta.kz</div>
                </div>
                {currentUser.role === 'operator' && <UserCheck className="w-4 h-4 text-sky-400" />}
              </button>
              <button
                onClick={() => onSelectRole('admin')}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                  currentUser.role === 'admin' ? 'bg-slate-800 font-bold text-white' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-purple-400">Администратор ДЧС</div>
                  <div className="text-[11px] text-slate-400">admin@saqta.kz</div>
                </div>
                {currentUser.role === 'admin' && <UserCheck className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
