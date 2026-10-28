import React from "react";
import { Cpu, Database, BellRing, ShieldCheck, ArrowRight, Activity, Sparkles, Sliders } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingHowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Database,
      title: "Сбор телеметрии и метеоданных",
      description:
        "Непрерывный опрос сенсорной сети гидропостов р. Есиль и открытого API Open-Meteo: текущий уровень воды (см), скорость подъема (см/ч), интенсивность дождя (мм/ч), температура воздуха (снеготаяние) и влажность грунта.",
      meta: "Частота телеметрии: 1 час • В режиме ЧС: потоково"
    },
    {
      number: "02",
      icon: Cpu,
      title: "ML-инференс и гидродинамика",
      description:
        "Изолированный алгоритм GradientBoosting анализирует скользящее окно замеров и пороги опасности. Модель рассчитывает ожидаемые уровни на +1ч, +2ч и +3ч с учетом гидродинамической инерции водотока.",
      meta: "Модель: GradientBoosting • R² = 0.94 • MAE = 2.1 см"
    },
    {
      number: "03",
      icon: Sliders,
      title: "Объяснимый ИИ (XAI)",
      description:
        "Платформа рассчитывает комплексный индекс паводкового риска (0–100) и декомпозирует вклад факторов: скорость подъема воды (55%), дельта до критической отметки (30%), осадки и температурный приток (15%).",
      meta: "Формирование обоснования на понятном для штаба языке"
    },
    {
      number: "04",
      icon: BellRing,
      title: "Оповещение 112 и принятие мер",
      description:
        "При переходе в «Желтый» или «Красный» код опасности система автоматически генерирует оперативный бюллетень ДЧС, отправляет экстренное сообщение в Telegram-канал штаба и запускает протокол эвакуации.",
      meta: "Время реакции системы: < 3 секунд"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-bold mb-2">
            АРХИТЕКТУРА И ТЕХНОЛОГИИ
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Как работает единая платформа «Saqta.kz»
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            От момента замера датчиком уровня до автоматического оповещения штаба ДЧС СКО и жителей пойменных микрорайонов.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="border-slate-200 shadow-sm bg-white p-6 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-sky-600 font-mono">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  {step.meta}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
