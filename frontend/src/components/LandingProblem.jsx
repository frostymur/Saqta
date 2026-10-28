import React from "react";
import { AlertTriangle, TrendingUp, Droplets, MapPin, ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export default function LandingProblem() {
  return (
    <section id="about-section" className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Вызовы гидрологической безопасности Казахстана
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Почему раннее прогнозирование паводков на реке Есиль критически важно?
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Весной 2024 года Северо-Казахстанская область столкнулась с крупнейшим паводком за последние 80 лет. Перелив через гребень Сергеевского водохранилища превысил исторический максимум, создав угрозу затопления г. Петропавловск.
          </p>
        </div>

        {/* 3 Key Problem vs Solution Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Фактор гидрологического запаздывания (48ч)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Волна от Сергеевского водохранилища идет до Петропавловска около 2 суток. Без математической модели сложно определить точный час выхода реки в пойму и высоту пика возле моста и пос. Заречный.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-amber-800">
              ➔ Saqta.kz рассчитывает динамику волны заранее
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Угроза жилым массивам и инфраструктуре
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Поселок Заречный, Кожевенный завод, насосная станция первого подъема ТОО «Кызылжар Су» и стратегическая трасса Челябинск-Новосибирск находятся в прямой зоне риска при отметке выше 940 см.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-red-700">
              ➔ Превентивная защита и возведение дамб
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Переход от реагирования к прогнозу
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Традиционный подход фиксировал подтопление постфактум. Платформа Saqta.kz переводит работу ДЧС на предиктивную модель: прогноз подъема на 1–3 часа вперед с оценкой факторов осадков и снеготаяния.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-sky-800">
              ➔ Эвакуация людей и скота без паники
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
