import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingFaq() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "За сколько часов система Saqta.kz прогнозирует подъем воды?",
      a: "Модель машинного обучения платформы выдает прогнозные отметки уровня воды с заблаговременностью от 1 до 3 часов с дискретностью в 1 час, а также учитывает макро-волну сброса Сергеевского водохранилища, которая доходит до г. Петропавловск за 48 часов."
    },
    {
      q: "Какие факторы учитываются при расчете индекса паводковой опасности?",
      a: "Индекс риска (0–100) рассчитывается на базе 3 ключевых групп параметров: динамическая скорость подъема воды (вес 55%), текущий уровень воды относительно порогов предупреждения и критического затопления (вес 30%), метеорологические осадки и температура снеготаяния (вес 15%)."
    },
    {
      q: "Как жители Петропавловска узнают о критической опасности подтопления?",
      a: "При достижении гидропостом отметки «Желтого» или «Красного» кода опасности система автоматически передает данные в ситуационный центр ДЧС СКО для рассылки экстренных СМС по каналам 112, активации сирен «Внимание всем!» и информирования местных мобильных патрулей."
    },
    {
      q: "Где находятся пункты временного размещения (ПВР) в г. Петропавловск?",
      a: "В Петропавловске развернуты эвакопункты на базе средних общеобразовательных школ и колледжей: СШ №12, СШ №14, СКППК (Северо-Казахстанский профессионально-педагогический колледж), Военного института Национальной гвардии РК."
    },
    {
      q: "Интегрирована ли система Saqta.kz с Казгидрометом и МЧС РК?",
      a: "Да, система разработана для бесшовной интеграции с открытыми бюллетенями РГП «Казгидромет», сенсорной IoT-сетью МЧС РК и погодными API-шлюзами."
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-bold mb-2">
            ВОПРОСЫ И ОТВЕТЫ
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Часто задаваемые вопросы о паводковом мониторинге
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Разъяснения для жителей Северо-Казахстанской области и специалистов служб спасения.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180 text-sky-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
