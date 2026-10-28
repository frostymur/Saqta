import React from "react";
import { Building2, ShieldAlert, Users, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingBenefits() {
  const groups = [
    {
      icon: Building2,
      badge: "ГОСУДАРСТВО",
      title: "МЧС РК и Акимат СКО",
      subtitle: "Стратегическое планирование и снижение ущерба бюджету",
      features: [
        "Единый ситуационный геоинформационный центр по всему бассейну р. Есиль",
        "Обоснованное распределение инженерной техники и формирование запасов инертных материалов",
        "Прозрачная гидрологическая аналитика для оперативного штаба и Правительства РК",
        "Снижение экономического ущерба от катастрофических подтоплений до 60%"
      ]
    },
    {
      icon: ShieldAlert,
      badge: "ОПЕРАТИВНЫЙ ШТАБ",
      title: "Дежурные операторы ДЧС",
      subtitle: "Автоматизация рутины и мгновенная реакция смены",
      features: [
        "Автоматический расчет добегания паводковой волны от Сергеевки до Петропавловска",
        "Формирование официального гидрологического бюллетеня МЧС РК за 1 секунду",
        "Прямая интеграция с каналами экстренного оповещения штаба в Telegram",
        "Фиксация протоколов действий дежурной смены в едином цифровом журнале"
      ]
    },
    {
      icon: Users,
      badge: "НАСЕЛЕНИЕ",
      title: "Жители г. Петропавловск",
      subtitle: "Безопасность жизни, семей, скота и имущества",
      features: [
        "Запас времени от 1 до 3 часов до фактического выхода воды на улицы поселка",
        "Точный список адресов ближайших пунктов временного размещения (ПВР)",
        "Возможность спокойного сбора документов, детей, домашнего скота и техники",
        "Прямой канал передачи экстренных сигналов о подтоплении в дежурную часть 112"
      ]
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-bold mb-2">
            ЦЕННОСТЬ ДЛЯ СТРАНЫ
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Преимущества внедрения платформы «Saqta.kz»
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Платформа объединяет государственные ведомства, службы спасения и граждан в единую цифровую экосистему гидрологической безопасности.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="border-slate-200 shadow-sm bg-white p-6 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-normal">
                    {item.subtitle}
                  </p>

                  <ul className="space-y-2.5">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
