import React from "react";
import { Brain, Sparkles, TrendingUp, Cpu, Database, BellRing, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function MlTechnologySection() {
  return (
    <section id="ml-section" className="py-12 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <Brain className="w-4 h-4" />
              Искусственный интеллект и гидрологическое моделирование
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Как работает предиктивная модель паводка «Saqta ML»
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Комплекс алгоритмов машинного обучения GradientBoosting и гидравлической гидродинамики для бассейна реки Есиль с заблаговременностью прогноза до 3 часов.
            </p>
          </div>

          <Badge className="bg-purple-100 text-purple-900 border-purple-300 font-bold px-3 py-1">
            XAI • Объяснимый ИИ МЧС РК
          </Badge>
        </div>

        {/* 3 Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Этап 1 • Сбор данных
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Сенсорная сеть и метеорология
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Непрерывный прием телеметрии гидропостов Казгидромет: отметка уровня воды (см), скорость подъема (см/ч), осадки (мм/ч), температура воздуха (интенсивность снеготаяния) и влажность грунта.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              Интервал опроса: 1 час (в ЧС: real-time)
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between border-t-4 border-t-purple-600">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                Этап 2 • ML Инференс
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Модель GradientBoosting & Гидравлика
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Расчет кривой движения паводковой волны с учетом задержки добегания от Сергеевского водохранилища до пос. Заречный (~48 часов) и нелинейного переполнения поймы р. Есиль.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-purple-700 font-bold">
              Метрики: MAE = 2.1 см • R² = 0.94
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold mb-4">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Этап 3 • Реагирование
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Оповещение 112 и превентивная эвакуация
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                При превышении порога предупреждения формируется автоматический экстренный бюллетень, рассылаются директивы дежурной смене ДЧС и уведомления жителям через каналы МЧС.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              Запас времени: 1–3 часа до волны
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
