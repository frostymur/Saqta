import React from "react";
import { Shield, Sparkles, ArrowRight, PhoneCall, ChevronRight, Activity, Clock, Award, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingHero({ onOpenAuth }) {
  return (
    <section className="relative bg-gradient-to-b from-[#0F2942] via-[#12314E] to-[#F1F5F9] text-white pt-12 pb-20 px-4 sm:px-8 overflow-hidden">
      {/* Kazakh national pattern watermark */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-kazakh-pattern" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Official Tag */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-xs font-bold py-1 px-3">
            DIGITAL URPAQ 2026 • МЧС РК
          </Badge>
          <span className="text-xs text-slate-300 font-medium">
            Государственная геоинформационная система мониторинга паводков
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Интеллектуальная платформа мониторинга и прогнозирования паводков{" "}
          <span className="text-amber-400">«Saqta.kz»</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl font-normal">
          Цифровой щит бассейна реки Есиль (г. Петропавловск, Северо-Казахстанская область).
          Раннее прогнозирование движения паводковой волны с заблаговременностью от 1 до 3 часов с помощью машинного обучения, превентивная эвакуация и предотвращение ущерба населению.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <a href="#about-section">
            <Button size="lg" className="bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-950/40">
              О платформе
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>

          <a href="#stations-section">
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm font-semibold"
            >
              Гидропосты реки Есиль
            </Button>
          </a>

          <Button
            size="lg"
            variant="govNavy"
            onClick={onOpenAuth}
            className="bg-[#0A1D30] hover:bg-blue-900 text-amber-300 border border-amber-400/40 font-bold"
          >
            Вход через eGov / ЭЦП
          </Button>
        </div>

        {/* 4 Key National Impact Cards (White on Slate-100) */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Запас времени
                </span>
                <Badge variant="default" className="text-[10px]">Предупреждение</Badge>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                1–3 часа
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Заблаговременный расчет добегания пика паводковой волны к жилым массивам
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Точность ML
                </span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
                  GradientBoosting
                </Badge>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                R² = 0.94
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Средняя абсолютная ошибка прогноза уровня воды составляет всего 2.1 см
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Опорные створы
                </span>
                <Badge variant="secondary" className="text-[10px]">СКО</Badge>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                4 поста
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Контроль каскада: Сергеевка ➔ с. Покровка ➔ Петропавловск ➔ пос. Заречный
              </p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Режим работы
                </span>
                <Badge variant="low" className="text-[10px]">Непрерывно</Badge>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                24 / 7
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Круглосуточный автоматический мониторинг с мгновенным оповещением штаба 112
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
