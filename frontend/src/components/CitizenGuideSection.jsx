import React, { useState } from "react";
import { ShieldCheck, PhoneCall, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export default function CitizenGuideSection() {
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
    }, 5000);
  };

  return (
    <section id="citizen-section" className="py-12 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Халыққа арналған • Для граждан
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Памятка населению и экстренная связь со службой 112
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Порядок действий жителей пойменных микрорайонов г. Петропавловск (Заречный, Кожевенный завод, Кызылжарский район) при угрозе подъема уровня воды в р. Есиль.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 4 Action Steps for Citizens (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <Card className="border-slate-200 shadow-sm bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Подготовьте документы и «тревожный чемоданчик»
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Сложите в непромокаемый пакет удостоверения личности, свидетельства о рождении, документы на недвижимость, запас необходимых медикаментов, фонарик, пауэрбанк и запас питьевой воды на 3 суток.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Обесточьте жилье и перекройте коммуникации
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Перед выходом из дома отключите электропитание в щитке, перекройте вентили подачи природного газа и воды. Перенесите ценные вещи на чердак или верхние этажи.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Направляйтесь в пункты временного размещения (ПВР)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    В г. Петропавловск развернуты ПВР на базе средних школ и колледжей (СШ №12, СШ №14, СКППК) с горячим питанием, спальными местами и медицинской помощью.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Отвяжите домашних животных
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Не оставляйте собак на привязи и скот в закрытых загонах. Волонтерские и ветеринарные пункты приема животных развернуты во всех эвакопунктах СКО.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Citizen Emergency Report Form (5 cols) */}
          <Card className="lg:col-span-5 border-slate-300 shadow-sm bg-white p-6">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Оперативное обращение в ДЧС СКО
                </h3>
                <p className="text-xs text-slate-500">
                  Прямая передача координат в диспетчерский пункт 112
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Обращение успешно зарегистрировано!
                </h4>
                <p className="text-xs text-slate-600">
                  Оперативная группа ДЧС СКО уведомлена. При возникновении прямой угрозы жизни немедленно звоните по номеру <strong>112</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Адрес / Район происшествия:
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="г. Петропавловск, пос. Заречный, ул. Речная, 12"
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
                    placeholder="+7 (705) 000-00-00"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Характер ситуации (подъем воды, перелив дороги):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Вода подошла к приусадебному участку, уровень поднялся примерно на 20 см за последний час..."
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
                  Отправить сигнал в оперативный штаб 112
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
