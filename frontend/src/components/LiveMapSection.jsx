import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MapPin, Droplets, AlertTriangle, TrendingUp, Sparkles, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function LiveMapSection({ stations, selectedStation, onSelectStation }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // MapLibre GL with CartoDB Positron Light Tiles (GovTech KZ light style)
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap, © CARTO"
          }
        },
        layers: [
          {
            id: "carto-light-layer",
            type: "raster",
            source: "carto-light",
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [68.4, 54.4],
      zoom: 7.3,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // 1. Русло реки Есиль (Геометрия от Сергеевки до Петропавловска)
      const esilGeoJson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [67.4111, 53.8824], // Сергеевское вдхр.
            [67.9200, 54.0500],
            [68.4000, 54.1800],
            [68.8520, 54.2678], // с. Покровка
            [68.9900, 54.5200],
            [69.0800, 54.7200],
            [69.1389, 54.8753], // Петропавловск Мост
            [69.1650, 54.9120], // Пос. Заречный
            [69.2100, 54.9900]
          ]
        }
      };

      map.addSource("esil-river-source", {
        type: "geojson",
        data: esilGeoJson
      });

      // Линия русла р. Есиль
      map.addLayer({
        id: "esil-river-line",
        type: "line",
        source: "esil-river-source",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#0284c7",
          "line-width": 4.5,
          "line-opacity": 0.85
        }
      });

      // 2. Зона пойменного затопления пос. Заречный
      const zarechnyPolygon = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [69.1450, 54.9000],
              [69.1850, 54.9020],
              [69.1950, 54.9350],
              [69.1550, 54.9300],
              [69.1450, 54.9000]
            ]
          ]
        }
      };

      map.addSource("zarechny-flood-source", {
        type: "geojson",
        data: zarechnyPolygon
      });

      map.addLayer({
        id: "zarechny-flood-fill",
        type: "fill",
        source: "zarechny-flood-source",
        paint: {
          "fill-color": "#dc2626",
          "fill-opacity": 0.2,
          "fill-outline-color": "#ef4444"
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update map markers according to light theme MChS badges
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((st) => {
      const isSelected = selectedStation?.id === st.id;
      const isHigh = st.current_risk_level === "high";
      const isMedium = st.current_risk_level === "medium";

      const badgeBg = isHigh
        ? "bg-red-600 text-white shadow-red-500/40"
        : isMedium
        ? "bg-amber-500 text-white shadow-amber-500/40"
        : "bg-emerald-600 text-white shadow-emerald-500/40";

      const borderClass = isSelected ? "ring-4 ring-sky-500 scale-110" : "ring-2 ring-white";

      const el = document.createElement("div");
      el.className = "cursor-pointer group flex flex-col items-center";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isHigh ? `<span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-60"></span>` : ""}
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${borderClass} ${badgeBg} transition-all">
            ${isHigh ? "!" : (isMedium ? "▲" : "●")}
          </div>
        </div>
        <div class="mt-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-bold text-slate-900 shadow-md whitespace-nowrap">
          ${st.name.replace("Гидропост ", "").replace("водохранилище", "вдхр.")}: 
          <span class="font-mono text-sky-700">${st.current_water_level || "--"} см</span>
        </div>
      `;

      el.addEventListener("click", () => {
        onSelectStation(st);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([st.lng, st.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [stations, selectedStation]);

  // Smooth fly to station when selected
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedStation.lng, selectedStation.lat],
        zoom: 9.8,
        essential: true,
        duration: 1000
      });
    }
  }, [selectedStation]);

  return (
    <section id="map-section" className="py-12 px-4 sm:px-8 bg-slate-100 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              Геоинформационная система (ГИС)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Интерактивная карта мониторинга бассейна реки Есиль
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Траектория движения паводковой волны от Сергеевского гидроузла до поймы г. Петропавловск. Нажмите на гидропост для просмотра детальной телеметрии и ML-прогноза.
            </p>
          </div>

          {/* Quick Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="low">Штатный уровень</Badge>
            <Badge variant="medium">Желтый код (Внимание)</Badge>
            <Badge variant="high">Красный код (Угроза ЧС)</Badge>
          </div>
        </div>

        {/* Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Container (8 cols) */}
          <Card className="lg:col-span-8 overflow-hidden border-slate-200 shadow-sm p-0 flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Картографический слой МЧС РК • СКО
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Масштаб: Бассейн Есиль (Петропавловский гидроузел)
              </span>
            </div>

            <div className="relative w-full h-[480px]">
              <div ref={mapContainer} className="w-full h-full" />

              {/* Floating Map Info Overlay */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-md text-xs text-slate-700 max-w-xs pointer-events-none">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  Каскад добегания паводка:
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>1. Сергеевское вдхр. ➔ перелив плотины</div>
                  <div>2. с. Покровка (~24-36ч добегания)</div>
                  <div>3. г. Петропавловск (Мост) (~48ч)</div>
                  <div>4. пос. Заречный ➔ зона затопления поймы</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Station Selection Cards (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Опорные гидрологические посты:
            </div>

            {stations.map((st) => {
              const isSelected = selectedStation?.id === st.id;
              const isHigh = st.current_risk_level === "high";
              const isMedium = st.current_risk_level === "medium";

              const badgeVariant = isHigh ? "high" : isMedium ? "medium" : "low";
              const badgeLabel = isHigh ? "Красный код" : isMedium ? "Желтый код" : "В норме";

              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStation(st)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? "border-sky-500 shadow-md ring-1 ring-sky-500"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {st.name}
                    </span>
                    <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <div className="text-xs text-slate-500">Текущий уровень:</div>
                      <div className="text-2xl font-black font-mono text-slate-900">
                        {st.current_water_level || "---"}{" "}
                        <span className="text-xs font-semibold text-slate-500">см</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Критический порог:</div>
                      <div className="text-sm font-bold font-mono text-red-600">
                        {st.thresholds?.crit_level} см
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Предупреждение: <strong>{st.thresholds?.warn_level} см</strong></span>
                    <span className="text-sky-700 font-semibold font-mono">
                      {isSelected ? "Выбран для анализа ✓" : "Выбрать →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
