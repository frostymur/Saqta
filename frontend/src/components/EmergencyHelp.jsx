import React, { useState, useEffect } from "react";
import { PhoneCall, Send, CheckCircle2, MessageSquare, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { KAZAKHSTAN_REGIONS } from "../data/regionsData";

export default function EmergencyHelp({ selectedRegionId }) {
  const defaultRegion = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId) || KAZAKHSTAN_REGIONS[0];
  const [activeRegion, setActiveRegion] = useState(defaultRegion);

  useEffect(() => {
    const found = KAZAKHSTAN_REGIONS.find((r) => r.id === selectedRegionId);
    if (found) setActiveRegion(found);
  }, [selectedRegionId]);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setAddress("");
      setPhone("");
      setNote("");
    }, 6000);
  };

  return (
    <section id="help-section" className="py-14 px-4 sm:px-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Emergency Hotlines & Telegram (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                Службы экстренной помощи Республики Казахстан
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Контакты для жителей: {activeRegion.name}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Если вам или вашим близким требуется помощь спасателей, медицинская помощь или эвакуация маломобильных граждан:
              </p>
            </div>

            {/* Hotline 112 Box */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-red-800">
                  Единая дежурно-диспетчерская служба РК
                </div>
                <div className="text-3xl font-black text-red-900 font-mono mt-0.5">
                  112
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Бесплатный звонок со всех операторов связи по всей территории Казахстана
                </div>
              </div>
              <a href="tel:112">
                <Button className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-2 px-5 shadow-sm">
                  Позвонить 112
                </Button>
              </a>
            </div>

            {/* Local DChS Office */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{activeRegion.dchsName}</span>
                <span className="text-slate-500">Дежурная часть, круглосуточно</span>
              </div>
              <a
                href={`tel:${activeRegion.dchsPhone}`}
                className="font-mono font-bold text-emerald-800 hover:text-emerald-950 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                {activeRegion.dchsPhone}
              </a>
            </div>

            {/* Telegram Channel */}
            <div className="rounded-xl border border-river-100 bg-river-50/60 p-4 text-xs text-river-950 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-river-600 text-white flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-river-950 block">Официальный Telegram-канал МЧС и ДЧС</span>
                  <span className="text-river-800">Проверенные сводки каждый час без слухов и фейковых аудио</span>
                </div>
              </div>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-river-700 hover:text-river-900 whitespace-nowrap"
              >
                Открыть канал →
              </a>
            </div>
          </div>

          {/* Right: Citizen Rescue Request Form (6 cols) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Сообщить о подтоплении дома или дороги
                  </h3>
                  <p className="text-xs text-slate-500">
                    Передайте координаты в оперативную группу {activeRegion.dchsName}
                  </p>
                </div>
              </div>

              {sent ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Сигнал принят дежурной сменой {activeRegion.shortName}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Информация передана ближайшему мобильному экипажу спасателей. При прямой угрозе жизни звоните по номеру <strong>112</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Город, населенный пункт, точный адрес:
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={`г. ${activeRegion.shortName}, ул. Речная, д. 8`}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Контактный телефон заявителя:
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (705) 000-00-00"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Что происходит (нужна ли лодка, есть ли дети/пожилые):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Вода подошла к калитке, в доме пожилая бабушка, самостоятельно выйти не можем..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 shadow-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Передать сигнал в оперативный штаб
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
