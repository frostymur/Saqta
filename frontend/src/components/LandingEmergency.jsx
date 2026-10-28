import React, { useState } from "react";
import { PhoneCall, MapPin, Send, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function LandingEmergency() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAddress("");
      setPhone("");
      setDescription("");
    }, 6000);
  };

  return (
    <section id="emergency-section" className="py-16 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Emergency Hotline Banner */}
        <div className="mb-10 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-red-200">
                Единая служба спасения Республики Казахстан
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                Круглосуточный номер 112 (Бесплатно со всех операторов)
              </div>
              <p className="text-xs text-red-100 mt-1 max-w-xl">
                При обнаружении быстрого прибывания воды, угрозе размыва дамбы или необходимости экстренной эвакуации незамедлительно звоните по номеру 112.
              </p>
            </div>
          </div>

          <a href="tel:112">
            <Button size="lg" className="bg-white text-red-700 hover:bg-slate-100 font-extrabold shadow-lg px-8">
              Позвонить 112
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Evacuation Shelters (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Безопасность населения
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Пункты временного размещения (ПВР) в г. Петропавловск
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Все эвакопункты оснащены горячим трехразовым питанием, спальными местами, медицинским пунктом и круглосуточной охраной сотрудниками МВД РК:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <Card className="border-slate-200 shadow-sm bg-white p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">ПВР №1</Badge>
                <div className="text-sm font-bold text-slate-900">Средняя школа №12</div>
                <div className="text-xs text-slate-500 mt-1">г. Петропавловск, ул. Пушкина, 45</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2">Вместимость: 250 человек</div>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">ПВР №2</Badge>
                <div className="text-sm font-bold text-slate-900">Средняя школа №14</div>
                <div className="text-xs text-slate-500 mt-1">г. Петропавловск, ул. Абая, 102</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2">Вместимость: 300 человек</div>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">ПВР №3</Badge>
                <div className="text-sm font-bold text-slate-900">СКППК (Колледж)</div>
                <div className="text-xs text-slate-500 mt-1">г. Петропавловск, ул. Конституции, 65</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2">Вместимость: 400 человек</div>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white p-4">
                <Badge variant="secondary" className="text-[10px] mb-2">ПВР №4</Badge>
                <div className="text-sm font-bold text-slate-900">Спортивный комплекс «Винокуров»</div>
                <div className="text-xs text-slate-500 mt-1">г. Петропавловск, ул. Жамбыла, 84</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2">Вместимость: 500 человек</div>
              </Card>
            </div>
          </div>

          {/* Citizen Incident Report Form (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-300 shadow-sm bg-white p-6">
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Экстренное обращение в штаб ДЧС СКО
                  </h3>
                  <p className="text-xs text-slate-500">
                    Передача сведений о подтоплении улицы или двора
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="p-5 rounded-xl bg-green-50 border border-green-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Обращение зарегистрировано в журнале ДЧС
                  </h4>
                  <p className="text-xs text-slate-600">
                    Дежурный диспетчер принял сигнал в обработку. Спасательные бригады ориентированы по указанному адресу.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Адрес или ориентир подтопления:
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="г. Петропавловск, пос. Заречный, ул. Первомайская"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Контактный телефон заявителя:
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (705) 123-45-67"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Описание ситуации:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Вода подошла к калитке, уровень поднялся примерно на 15 см за последний час..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="destructive"
                    size="default"
                    className="w-full bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-600/20"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Передать сигнал в оперативный штаб ДЧС
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
