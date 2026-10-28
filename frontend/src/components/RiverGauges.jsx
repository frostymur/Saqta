import React from "react";
import { Droplets, Compass, ShieldCheck, ArrowRight, Info } from "lucide-react";

export default function RiverGauges() {
  const posts = [
    {
      name: "Сергеевское водохранилище",
      tag: "Верховье реки • 70 км от города",
      level: "945 см",
      levelNote: "+145 см над гребнем плотины",
      status: "Желтый код",
      statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
      description: "Приток из верховий стабилизировался. Перелив через плотину идет с постоянным объемом, резкого нарастания волны нет."
    },
    {
      name: "Село Покровка",
      tag: "Промежуточный створ • 30 км от города",
      level: "980 см",
      levelNote: "Выход воды в пойменные луга",
      status: "Желтый код",
      statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
      description: "Волна от Сергеевки проходит этот участок. Время добегания остаточной волны до Петропавловска: около 24 часов."
    },
    {
      name: "Петропавловск (Городской мост)",
      tag: "Контрольный створ города",
      level: "962 см",
      levelNote: "Опасная отметка дороги: 980 см",
      status: "Внимание",
      statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
      description: "До перелива проезжей части моста осталось 18 см. Городская защитная дамба имеет высоту 1080 см — запас более метра."
    },
    {
      name: "Поселок Заречный (Пойма)",
      tag: "Низменная часть реки",
      level: "928 см",
      levelNote: "Порог выхода в пойму: 880 см",
      status: "Красный код",
      statusBadge: "bg-red-100 text-red-900 border-red-300",
      description: "Вода вышла в прибрежную полосу. Жители низких улиц организованно выезжают в эвакопункты или к родственникам."
    }
  ];

  return (
    <section id="gauges-section" className="py-14 px-4 sm:px-8 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
            <Compass className="w-4 h-4 text-emerald-700" />
            Каскад гидроузлов реки Есиль
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Откуда идет вода: замеры на гидропостах
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Вода от Сергеевского водохранилища идет до Петропавловска около 2 суток. Мы отслеживаем каждый створ, чтобы заранее знать, что будет в городе.
          </p>
        </div>

        {/* Visual River Safety Margin Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Запас прочности главной дамбы Петропавловска (створ у моста)</span>
            </div>
            <div className="text-xs text-emerald-900 font-mono font-bold bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-md">
              Безопасный запас: 118 см
            </div>
          </div>

          {/* Graphical level bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
              <div className="bg-river-600 h-full rounded-full transition-all" style={{ width: "89%" }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0 см (дно)</span>
              <span className="font-bold text-slate-800">Текущий уровень: 962 см</span>
              <span className="text-amber-800 font-semibold">Перелив дороги: 980 см</span>
              <span className="text-emerald-800 font-bold">Гребень дамбы: 1080 см</span>
            </div>
          </div>
        </div>

        {/* 4 Station Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((p, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.statusBadge}`}>
                    {p.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Створ #{idx + 1}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1">
                  {p.name}
                </h3>
                <div className="text-[11px] text-slate-500 mb-3">{p.tag}</div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {p.level}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{p.levelNote}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
