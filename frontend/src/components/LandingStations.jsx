import React from "react";
import { MapPin, Droplets, ShieldCheck, AlertCircle, ArrowUpRight, Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingStations() {
  const stations = [
    {
      id: 1,
      name: "Сергеевское водохранилище",
      location: "г. Сергеевка, район Шал акына (СКО)",
      coords: "53.8824° N, 67.4111° E",
      role: "Верхний гидроузел бассейна. Регулирует сток реки Есиль.",
      warn_level: "800 см (гребень плотины)",
      crit_level: "1100 см (максимальный исторический перелив)",
      status: "Желтый код (Внимание)",
      statusVariant: "medium",
      currentEstimate: "945 см (+145 см над гребнем)"
    },
    {
      id: 2,
      name: "Гидропост с. Покровка",
      location: "Есильский район, с. Покровка (СКО)",
      coords: "54.2678° N, 68.8520° E",
      role: "Промежуточный створ добегания волны (~24–36 часов от плотины).",
      warn_level: "950 см (выход на пойменные луга)",
      crit_level: "1100 см (угроза подтопления жилых домов села)",
      status: "Желтый код (Внимание)",
      statusVariant: "medium",
      currentEstimate: "980 см"
    },
    {
      id: 3,
      name: "Гидропост г. Петропавловск (Мост)",
      location: "г. Петропавловск, автомобильный мост через р. Есиль",
      coords: "54.8753° N, 69.1389° E",
      role: "Главный контрольный створ областного центра (~48 часов от плотины).",
      warn_level: "940 см (выход воды в пойму)",
      crit_level: "980 см (перелив дороги на въезде в город)",
      status: "Желтый код (Внимание)",
      statusVariant: "medium",
      currentEstimate: "962 см (запас 18 см до крит)"
    },
    {
      id: 4,
      name: "Пос. Заречный (Зона поймы)",
      location: "г. Петропавловск, микрорайон Заречный",
      coords: "54.9120° N, 69.1650° E",
      role: "Низменная пойменная зона, первая принимающая удар разлива.",
      warn_level: "880 см (подтопление прибрежной зоны)",
      crit_level: "950 см (перелив защитной дамбы поселка)",
      status: "Красный код (Угроза ЧС)",
      statusVariant: "high",
      currentEstimate: "928 см (пойма затоплена)"
    }
  ];

  return (
    <section id="stations-section" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4 text-sky-600" />
              Гидрологическая сеть бассейна реки Есиль
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Опорные гидропосты Северо-Казахстанской области
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Система ведет непрерывный мониторинг четырех ключевых створов р. Есиль, определяющих безопасность областного центра г. Петропавловск.
            </p>
          </div>
        </div>

        {/* 4 Station Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {stations.map((st) => (
            <Card key={st.id} className="border-slate-200 shadow-sm bg-white p-6 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {st.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.location}</span>
                    </div>
                  </div>
                  <Badge variant={st.statusVariant}>{st.status}</Badge>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {st.role}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Порог предупреждения:</span>
                    <strong className="text-amber-800 font-mono font-bold">{st.warn_level}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Критический порог:</span>
                    <strong className="text-red-700 font-mono font-bold">{st.crit_level}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">{st.coords}</span>
                <span className="font-semibold text-slate-900">
                  Оценка: <strong className="text-sky-700 font-mono">{st.currentEstimate}</strong>
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Official MChS Risk Status Standards Reference Table */}
        <div className="border border-slate-200 rounded-2xl bg-slate-50/60 p-6 sm:p-8">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Стандарты цветовой индикации уровней опасности МЧС РК
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Классификация гидрологической обстановки в соответствии с нормативными актами Республики Казахстан для светлых интерфейсов:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Уровень риска / Статус</th>
                  <th className="py-3 px-4">Официальный бейдж МЧС РК</th>
                  <th className="py-3 px-4">Критерий для р. Есиль</th>
                  <th className="py-3 px-4">Действия служб</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Низкий риск (Штатный режим)
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="low">Штатный режим</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Уровень воды в русле ниже отметки предупреждения. Запас до выхода в пойму &gt; 50 см.
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Плановое дежурство, регулярный замер телеметрии раз в 1 час.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Средний риск (Внимание — Желтый код)
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="medium">Желтый код (Внимание)</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Уровень достиг порога предупреждения (940 см Мост, 880 см Заречный). Выход в пойму.
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Повышенная готовность мотопомп, проверка состояния дамб и готовности ПВР.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Высокий риск (Угроза ЧС — Красный код)
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="high">Красный код (Угроза ЧС)</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Превышение критического уровня (980 см Мост, 950 см Заречный). Угроза жилым массивам.
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Объявление режима ЧС, превентивная эвакуация населения через сирены и 112.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Офлайн / Ошибка датчика
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="offline">Датчик офлайн</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Отсутствие телеметрии более 2 циклов опроса либо сбой телекоммуникаций.
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Выезд аварийно-технической группы связи ДЧС на гидропост.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
