import React, { useState } from "react";
import { MapPin, Bus, ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, Home } from "lucide-react";

export default function DistrictCheck() {
  const districts = [
    {
      id: "zarechny",
      name: "Поселок Заречный",
      tag: "Зона поймы реки",
      status: "evacuation",
      statusLabel: "Идет плановый выезд жителей",
      statusColor: "text-red-800 bg-red-100 border-red-300",
      indicator: "bg-red-500",
      waterState: "Вода подошла к низменным участкам улиц Речная и Первомайская.",
      damState: "Земляной защитный вал сдерживает основной поток реки. Ведется круглосуточное патрулирование.",
      transport: "Легковой проезд ограничен. Движение открыто для высокопроходимой техники ДЧС и эвакуационных автобусов.",
      evacPoint: "Автобусы дежурят у магазина «Северный» (ул. Первомайская) с 08:00 до 22:00.",
      shelterName: "Средняя школа №12 (ул. Пушкина, 45)",
      shelterPhone: "+7 (7152) 46-21-30"
    },
    {
      id: "podgora",
      name: "Микрорайон Подгора",
      tag: "Нижняя часть города",
      status: "warning",
      statusLabel: "Повышенное внимание • Дамба держит",
      statusColor: "text-amber-800 bg-amber-100 border-amber-300",
      indicator: "bg-amber-500",
      waterState: "Уровень воды в старицах контролируется. Подтопления жилых домов нет.",
      damState: "Основная городская дамба имеет запас высоты более 1.2 метра до гребня.",
      transport: "Движение транспорта свободное по всем улицам микрорайона.",
      evacPoint: "Дежурный пункт сбора граждан развернут у школы №1 (ул. Коминтерна).",
      shelterName: "Средняя школа №14 (ул. Абая, 102)",
      shelterPhone: "+7 (7152) 33-14-15"
    },
    {
      id: "kozhoz",
      name: "Кожевенный завод (Кожзавод)",
      tag: "Прибрежная зона",
      status: "warning",
      statusLabel: "Под наблюдением спасателей",
      statusColor: "text-amber-800 bg-amber-100 border-amber-300",
      indicator: "bg-amber-500",
      waterState: "Вода вышла на прилегающие заливные луга, русло расширилось.",
      damState: "Насыпные дамбы укреплены мешкотарой с песком, дежурит караул спасателей.",
      transport: "Проезд открыт для всех видов транспорта.",
      evacPoint: "Остановка «Кожевенный завод», при необходимости подаются автобусы автопарка №1.",
      shelterName: "СКППК Колледж (ул. Конституции Казахстана, 65)",
      shelterPhone: "+7 (7152) 46-12-88"
    },
    {
      id: "teplichnoe",
      name: "Село Тепличное / Прибрежное",
      tag: "Пригородный район",
      status: "warning",
      statusLabel: "Мониторинг береговой линии",
      statusColor: "text-amber-800 bg-amber-100 border-amber-300",
      indicator: "bg-amber-500",
      waterState: "Идет перелив пойменных проток. До жилых строений запас 150 метров.",
      damState: "Временная защитная насыпь укреплена силами волонтеров и военнослужащих в/ч 6637.",
      transport: "Дорога между Петропавловском и с. Тепличное открыта.",
      evacPoint: "Центральная площадь села перед Домом культуры.",
      shelterName: "Эвакопункт Кызылжарского района (с. Бесколь)",
      shelterPhone: "+7 (7152) 50-11-22"
    },
    {
      id: "rabochiy",
      name: "Рабочий поселок / Бензострой",
      tag: "Верхняя терраса города",
      status: "safe",
      statusLabel: "Безопасно • Вне зоны разлива",
      statusColor: "text-green-700 bg-green-100 border-green-300",
      indicator: "bg-emerald-500",
      waterState: "Микрорайон находится на возвышенности. Риска подтопления рекой Есиль нет.",
      damState: "Защитные сооружения не требуются ввиду естественного рельефа.",
      transport: "Городской транспорт работает в обычном штатном режиме.",
      evacPoint: "Эвакуация не требуется.",
      shelterName: "Штатные службы района работают в обычном графике",
      shelterPhone: "112"
    },
    {
      id: "dachi",
      name: "Дачные массивы поймы р. Есиль",
      tag: "Заливные участки",
      status: "evacuation",
      statusLabel: "Нахождение людей запрещено",
      statusColor: "text-red-800 bg-red-100 border-red-300 animate-pulse",
      indicator: "bg-red-500",
      waterState: "Дачные участки в пойме затоплены водой реки Есиль.",
      damState: "Дамбы отсутствуют — зона естественного паводкового разлива.",
      transport: "Проезд перекрыт экипажами патрульной полиции. Электричество отключено.",
      evacPoint: "Граждане вывезены. Выставлены полицейские посты охраны имущества от мародерства.",
      shelterName: "По всем вопросам обращаться на телефон 112",
      shelterPhone: "112"
    }
  ];

  const [selectedId, setSelectedId] = useState("zarechny");
  const selected = districts.find((d) => d.id === selectedId) || districts[0];

  return (
    <section id="district-section" className="py-14 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
            <Home className="w-4 h-4 text-emerald-700" />
            Индивидуальная проверка для жителей
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Какая обстановка в вашем микрорайоне?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Выберите район проживания, чтобы узнать фактический статус воды, состояние дамб, проезд и адреса эвакуационных автобусов:
          </p>
        </div>

        {/* District Selector Buttons (Horizontal clean grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {districts.map((d) => {
            const isSelected = d.id === selectedId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm"
                    : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-2 h-2 rounded-full ${d.indicator}`} />
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.status === "safe" ? "Безопасно" : d.status === "warning" ? "Внимание" : "ЧС"}
                  </span>
                </div>
                <div className="font-bold text-slate-900 leading-tight">
                  {d.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected District Detailed Briefing Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">{selected.tag}</div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {selected.name}
              </h3>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border w-fit ${selected.statusColor}`}>
              {selected.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            {/* Left detail column */}
            <div className="space-y-4">
              <div>
                <span className="font-bold text-slate-900 block mb-1">1. Ситуация с водой:</span>
                <p className="leading-relaxed text-slate-600">{selected.waterState}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">2. Состояние дамбы и защитных валов:</span>
                <p className="leading-relaxed text-slate-600">{selected.damState}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">3. Проезд для личного транспорта:</span>
                <p className="leading-relaxed text-slate-600">{selected.transport}</p>
              </div>
            </div>

            {/* Right action column */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1">
                  <Bus className="w-4 h-4 text-emerald-700" />
                  <span>Точка сбора и автобусы эвакуации:</span>
                </div>
                <p className="text-emerald-900 leading-relaxed text-xs">
                  {selected.evacPoint}
                </p>
              </div>

              <div className="pt-3 border-t border-emerald-100">
                <span className="font-bold text-emerald-950 block text-xs mb-1">
                  Ближайший пункт временного размещения (ПВР):
                </span>
                <div className="text-slate-900 font-semibold">{selected.shelterName}</div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <a
                    href={`tel:${selected.shelterPhone}`}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Дежурный: {selected.shelterPhone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
