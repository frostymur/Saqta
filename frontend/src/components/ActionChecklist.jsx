import React from "react";
import { CheckSquare, ShieldCheck, HeartPulse, ZapOff, Home } from "lucide-react";

export default function ActionChecklist() {
  const steps = [
    {
      number: "1",
      icon: HeartPulse,
      title: "Собрать самое необходимое за 10 минут",
      subtitle: "В один непромокаемый пакет или рюкзак:",
      items: [
        "Удостоверения личности, свидетельства о рождении детей, документы на жилье",
        "Банковские карты и наличные деньги",
        "Постоянные жизненно важные лекарства (от давления, диабета, ингаляторы)",
        "Телефон, пауэрбанк и зарядное устройство",
        "Сменное белье и теплые носки на каждого члена семьи"
      ]
    },
    {
      number: "2",
      icon: ZapOff,
      title: "Подготовить дом перед выходом",
      subtitle: "Чтобы избежать пожара и спасти имущество:",
      items: [
        "Отключите рубильник электричества на счетчике в коридоре",
        "Перекройте вентиль подачи газа на трубе или баллоне",
        "Поднимите дорогую бытовую технику на чердак или верхние столы",
        "Обязательно отвяжите собаку от будки, откройте загон для скота",
        "Плотно закройте окна и заприте входную дверь на ключ"
      ]
    },
    {
      number: "3",
      icon: Home,
      title: "Пройти к автобусу или в эвакопункт",
      subtitle: "Вас обеспечат всем необходимым бесплатно:",
      items: [
        "Выйдите к точке посадки в автобус или направляйтесь в ближайшую школу (ПВР)",
        "В эвакопункте дежурят медики, психологи и сотрудники полиции",
        "Предоставляется трехразовое горячее питание и чистое спальное место",
        "За оставленным жильем ведет круглосуточный надзор патрульная полиция от мародеров",
        "При необходимости эвакуации маломобильных людей сразу звоните 112"
      ]
    }
  ];

  return (
    <section id="actions-section" className="py-14 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            Инструкция без паники
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Что делать, если ваш район в зоне риска?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Простой алгоритм из 3 шагов. Сохраняйте спокойствие: городские службы полностью подготовлены к встрече и размещению жителей.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                      {s.number}
                    </span>
                    <Icon className="w-5 h-5 text-emerald-700" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                    {s.title}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">{s.subtitle}</div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
