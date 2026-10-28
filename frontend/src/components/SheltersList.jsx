import React from "react";
import { Building2, PhoneCall, MapPin, Check, Heart, Shield } from "lucide-react";

export default function SheltersList() {
  const shelters = [
    {
      name: "Средняя школа №12",
      address: "г. Петропавловск, ул. Пушкина, 45",
      phone: "+7 (7152) 46-21-30",
      capacity: "250 мест",
      features: "Горячее питание, медпункт, психолог, детский уголок"
    },
    {
      name: "Средняя школа №14",
      address: "г. Петропавловск, ул. Абая, 102",
      phone: "+7 (7152) 33-14-15",
      capacity: "300 мест",
      features: "Спальные места, комната матери и ребенка, охрана полицией"
    },
    {
      name: "СКППК (Колледж педагогики и права)",
      address: "г. Петропавловск, ул. Конституции Казахстана, 65",
      phone: "+7 (7152) 46-12-88",
      capacity: "400 мест",
      features: "Столовая, душевые, фельдшерский пункт, склад гуманитарной помощи"
    },
    {
      name: "Дворец спорта им. А. Винокурова",
      address: "г. Петропавловск, ул. Жамбыла, 84",
      phone: "+7 (7152) 50-80-90",
      capacity: "500 мест",
      features: "Большой резервный пункт, полевая кухня, волонтерский штаб"
    }
  ];

  return (
    <section id="shelters-section" className="py-14 px-4 sm:px-8 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Безопасное размещение
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Пункты временного размещения (ПВР) в Петропавловске
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Если ваш дом оказался в зоне подтопления, эти эвакуационные пункты уже открыты, согреты и принимают жителей круглосуточно:
          </p>
        </div>

        {/* 4 Shelters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {shelters.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {s.name}
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                    {s.capacity}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{s.address}</span>
                </div>

                <div className="text-xs text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg mb-4">
                  {s.features}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={`tel:${s.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Позвонить дежурному: {s.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance Note */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>
            <strong>Важно:</strong> Проживание, трехразовое горячее питание и медицинская помощь во всех пунктах временного размещения предоставляются <strong>бесплатно за счет государственного резерва</strong>.
          </span>
        </div>
      </div>
    </section>
  );
}
