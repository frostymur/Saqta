import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function MapView({ stations, selectedStation, onSelectStation }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Инициализация карты MapLibre GL с открытым стилем CartoDB Dark Matter
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CARTO"
          }
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [68.4, 54.4], // Центр между Сергеевкой и Петропавловском
      zoom: 7.2,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // 1. Добавляем русло реки Есиль (геометрия течения от Сергеевского водохранилища до Петропавловска)
      const esilRiverGeoJson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [67.4111, 53.8824], // Сергеевка
            [67.9200, 54.0500],
            [68.4000, 54.1800],
            [68.8520, 54.2678], // Покровка
            [68.9900, 54.5200],
            [69.0800, 54.7200],
            [69.1389, 54.8753], // Петропавловск Мост
            [69.1650, 54.9120], // Пос. Заречный
            [69.2100, 54.9900]  // Дальше по течению в Тюменскую область
          ]
        }
      };

      map.addSource("esil-river", {
        type: "geojson",
        data: esilRiverGeoJson
      });

      // Слой свечения реки
      map.addLayer({
        id: "esil-river-glow",
        type: "line",
        source: "esil-river",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#0ea5e9",
          "line-width": 8,
          "line-opacity": 0.35,
          "line-blur": 4
        }
      });

      // Основная нить реки Есиль
      map.addLayer({
        id: "esil-river-line",
        type: "line",
        source: "esil-river",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#38bdf8",
          "line-width": 3.5,
          "line-opacity": 0.85
        }
      });

      // 2. Зона пойменного затопления пос. Заречный (полигон)
      const zarechnyFloodPolygon = {
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

      map.addSource("zarechny-flood-zone", {
        type: "geojson",
        data: zarechnyFloodPolygon
      });

      map.addLayer({
        id: "zarechny-flood-layer",
        type: "fill",
        source: "zarechny-flood-zone",
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.22,
          "fill-outline-color": "#f87171"
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Обновление интерактивных маркеров гидропостов при смене данных
  useEffect(() => {
    if (!mapRef.current) return;

    // Удаляем старые маркеры
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((st) => {
      const isSelected = selectedStation?.id === st.id;
      const isHigh = st.current_risk_level === "high";
      const isMedium = st.current_risk_level === "medium";

      const color = isHigh ? "#EF4444" : isMedium ? "#F59E0B" : "#10B981";
      const ringBg = isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500";
      const borderCol = isSelected ? "border-white scale-125" : "border-slate-900";

      // Создаем кастомный DOM элемент
      const el = document.createElement("div");
      el.className = "cursor-pointer group flex flex-col items-center";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${(isHigh || isMedium) ? `
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full ${ringBg} opacity-50"></span>
          ` : ""}
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xl border-2 ${borderCol} transition-transform ${ringBg}">
            ${isHigh ? "!" : (isMedium ? "▲" : "●")}
          </div>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-200 whitespace-nowrap shadow-md">
          ${st.name.replace("Гидропост ", "").replace("водохранилище", "вдхр.")}
          <span class="ml-1 font-mono text-sky-400 font-bold">${st.current_water_level || "--"} см</span>
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

  // Плавное приближение при выборе станции
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedStation.lng, selectedStation.lat],
        zoom: 9.8,
        essential: true,
        duration: 1200
      });
    }
  }, [selectedStation]);

  return (
    <div className="relative w-full h-[460px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 bg-[#0F172A]/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 shadow-lg pointer-events-none">
        <div className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          Карта бассейна реки Есиль (СКО)
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Сергеевское вдхр. ➔ с. Покровка ➔ Петропавловск ➔ пос. Заречный
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-[#0F172A]/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 shadow-lg space-y-1.5">
        <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
          Легенда рисков
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Критический (Выше опасного порога)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Предупреждение (Выход в пойму)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Штатный уровень реки</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="w-3.5 h-1.5 bg-rose-500/40 border border-rose-400/80 rounded-sm"></span>
          <span>Зона подтопления (пос. Заречный)</span>
        </div>
      </div>
    </div>
  );
}
