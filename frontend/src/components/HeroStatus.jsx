import React from "react";
import { AlertCircle, Clock, TrendingUp, PhoneCall, ArrowDown, Droplets, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

export default function HeroStatus() {
  return (
    <section className="bg-gradient-to-b from-emerald-50/40 via-white to-white pt-10 pb-12 px-4 sm:px-8 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Title & Timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Бассейн реки Есиль • Северо-Казахстанская область
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Паводковая обстановка в Петропавловске
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Обновлено: сегодня, 12:45</span>
          </div>
        </div>

        {/* Central Reassuring Status Banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
              ▲
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Желтый код • Повышенная готовность
                </span>
                <span className="text-xs text-amber-800">
                  Городские дамбы держат нагрузку
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                Река Есиль вышла на пойменные луга. В микрорайоне Заречный вода подошла к низменным участкам, развернуты дежурные посты ДЧС и автобусы для выезда. В центральной части города и жилых массивах угрозы прорыва дамб нет.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core Metrics that Matter to People */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card 1: City Bridge */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">Уровень у моста (Петропавловск)</span>
              <span className="text-emerald-700 font-bold font-mono">Контрольный створ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">962</span>
              <span className="text-sm font-semibold text-slate-500">см</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              До перелива проезжей части моста: <strong>18 см</strong>. Запас высоты укрепленной дамбы: <strong>118 см</strong>.
            </p>
          </div>

          {/* Card 2: Sergeevskoe Reservoir */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">Сергеевское водохранилище</span>
              <span className="text-river-700 font-bold font-mono">Верхний бьеф</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">+145</span>
              <span className="text-sm font-semibold text-slate-500">см над гребнем</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Приток стабилизировался. Основная масса воды проходит участок Покровки в 70 км выше по течению.
            </p>
          </div>

          {/* Card 3: Forecast for Next Hours */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">Прогноз на ближайшие 3 часа</span>
              <span className="text-emerald-800 font-bold font-mono">Расчет гидрологов</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-800 font-mono">+3</span>
              <span className="text-sm font-semibold text-slate-500">см к вечеру</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Подъем продолжается в плавном темпе (+1 см/ч). Резких скачков уровня воды не прогнозируется.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a href="#district-section">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-4 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
              Узнать обстановку в своем микрорайоне
            </Button>
          </a>

          <a href="#actions-section">
            <Button variant="outline" className="text-xs font-semibold text-slate-700 border-slate-300 bg-white">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              Памятка: что делать жителям
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
