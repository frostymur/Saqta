import React from "react";
import { ShieldAlert, ArrowDown, FileText, PhoneCall, Droplets, MapPin, Activity, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function HeroLanding({ stations, onOpenBulletin, weather }) {
  const sergeevka = stations.find((s) => s.name.includes("Сергеевское")) || stations[0];
  const petroBridge = stations.find((s) => s.name.includes("Мост")) || stations[2];
  const zarechny = stations.find((s) => s.name.includes("Заречный")) || stations[3];

  const spillover = sergeevka?.current_water_level ? Math.max(0, sergeevka.current_water_level - 800) : 145;

  return (
    <section className="relative bg-gradient-to-b from-[#0F2942] via-[#12314E] to-[#F1F5F9] text-white pt-10 pb-16 px-4 sm:px-8 overflow-hidden">
      {/* Background soft national patterns */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-kazakh-pattern" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* State Tag */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold px-3 py-1">
            DIGITAL URPAQ 2026 • МЧС РК
          </Badge>
          <span className="text-xs text-slate-300 font-medium">
            Департамент по чрезвычайным ситуациям Северо-Казахстанской области
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Единая государственная платформа предиктивного мониторинга паводков{" "}
          <span className="text-amber-400">«Saqta.kz»</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl font-normal">
          Оперативный геоинформационный шлюз гидроузла реки Есиль (г. Петропавловск).
          Заблаговременное прогнозирование паводковой волны от 1 до 3 часов с помощью машинного обучения,
          анализ зон риска затопления и автоматическое оповещение оперативного штаба ДЧС.
        </p>

        {/* Official Live Status Notice (MChS Yellow / Orange code) */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/15 border-l-4 border-amber-500 border-t border-r border-b border-amber-500/30 text-slate-100 flex items-center justify-between flex-wrap gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Оперативная обстановка р. Есиль: Желтый уровень опасности
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                Идет перелив через гребень Сергеевского водохранилища. Прогноз добегания паводковой волны до г. Петропавловск: в активной фазе мониторинга.
              </div>
            </div>
          </div>

          {weather && (
            <div className="flex items-center gap-3 text-xs bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/80">
              <span className="text-slate-400">Петропавловск:</span>
              <span className="font-bold text-amber-300 font-mono">{weather.temperature}°C</span>
              <span className="text-sky-300 font-mono">{weather.rainfall} мм/ч</span>
              {weather.is_snowmelting && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">Снеготаяние</span>
              )}
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="#map-section">
            <Button size="lg" className="bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-900/40">
              <MapPin className="w-4 h-4 mr-2" />
              Интерактивная карта Есиль
            </Button>
          </a>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenBulletin}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            Официальный бюллетень ДЧС
          </Button>

          <a href="#citizen-section">
            <Button size="lg" variant="destructive" className="bg-red-600 hover:bg-red-500 font-bold">
              <PhoneCall className="w-4 h-4 mr-2" />
              Сообщить о подтоплении (112)
            </Button>
          </a>
        </div>

        {/* 4 Live Metrics Cards on White Background */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Сергеевское */}
          <Card className="border-slate-200 bg-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  Сергеевское вдхр.
                </span>
                <Badge variant="medium">Перелив</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {sergeevka?.current_water_level ?? "945"}
                </span>
                <span className="text-xs font-semibold text-slate-500">см</span>
                <span className="text-xs font-bold text-amber-700 font-mono">
                  (+{Math.round(spillover)} см над гребнем)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Порог перелива: 800 см • Крит: 1100 см
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Петропавловск Мост */}
          <Card className="border-slate-200 bg-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Петропавловск (Мост)
                </span>
                <Badge variant="medium">Внимание</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {petroBridge?.current_water_level ?? "962"}
                </span>
                <span className="text-xs font-semibold text-slate-500">см</span>
                <span className="text-xs font-bold text-red-600 font-mono">
                  (до крит: -{Math.max(0, 980 - (petroBridge?.current_water_level || 962))} см)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Предупр: 940 см • Крит: 980 см
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Пос. Заречный */}
          <Card className="border-slate-200 bg-white shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Пос. Заречный
                </span>
                <Badge variant="high">Пойма затоплена</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {zarechny?.current_water_level ?? "928"}
                </span>
                <span className="text-xs font-semibold text-slate-500">см</span>
                <span className="text-xs font-bold text-red-700 font-mono">
                  ВЫХОД В ПОЙМУ
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Предупр: 880 см • Крит: 950 см (дамба)
              </p>
            </CardContent>
          </Card>

          {/* Card 4: ML Прогноз */}
          <Card className="border-slate-200 bg-white shadow-md hover:shadow-lg transition-all border-l-4 border-l-purple-600">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  ML Горизонт анализа
                </span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                  AI Model
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-900 font-mono">
                  +3 часа
                </span>
                <span className="text-xs font-semibold text-slate-500">горизонт</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 flex items-center justify-between">
                <span>Точность: R² = 0.94</span>
                <span className="font-mono text-purple-700 font-bold">MAE: 2.1 см</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
