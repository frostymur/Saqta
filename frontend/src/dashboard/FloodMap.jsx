import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, LocateFixed, Navigation, Satellite } from "lucide-react";
import { normalizeHealth, riskMeta, stationRisk } from "./lib/format";

// Keyless light vector basemap (Positron) plus Esri satellite imagery. The
// vector style keeps the map white and airy while water, parks and roads stay
// visible, unlike a flat light-grey raster.
const POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";

const SATELLITE_STYLE = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

function stationLabelVisible(zoom) {
  return zoom >= 11.5;
}

const ZONE_RADIUS_KM = { medium: 1.2, high: 2.5 };

function circlePolygon(lat, lng, radiusKm, points = 48) {
  const earthKm = 6371;
  const angular = radiusKm / earthKm;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const coordinates = [];
  for (let i = 0; i <= points; i += 1) {
    const bearing = (i / points) * Math.PI * 2;
    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(angular) +
        Math.cos(latRad) * Math.sin(angular) * Math.cos(bearing)
    );
    const pointLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(latRad),
        Math.cos(angular) - Math.sin(latRad) * Math.sin(pointLat)
      );
    coordinates.push([(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI]);
  }
  return coordinates;
}

function updateDangerZones(map, stations) {
  if (!map || !map.isStyleLoaded()) return;
  const features = stations
    .filter((station) => {
      if (station.health === "offline") return false;
      const risk = stationRisk(station);
      return risk === "medium" || risk === "high";
    })
    .map((station) => {
      const risk = stationRisk(station);
      const radiusKm =
        Number(station.alert_radius_m) > 0
          ? Number(station.alert_radius_m) / 1000
          : ZONE_RADIUS_KM[risk];
      const lng = Number(station.lng);
      const lat = Number(station.lat);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        type: "Feature",
        properties: { risk, name: station.name },
        geometry: { type: "Polygon", coordinates: [circlePolygon(lat, lng, radiusKm)] },
      };
    })
    .filter(Boolean);

  const data = { type: "FeatureCollection", features };
  if (!map.getSource("station-zones")) {
    map.addSource("station-zones", { type: "geojson", data });
    const beforeId = map.getStyle()?.layers?.find((layer) => layer.type === "symbol")?.id;
    map.addLayer({
      id: "station-zones-fill",
      type: "fill",
      source: "station-zones",
      paint: {
        "fill-color": ["match", ["get", "risk"], "high", "#ef4444", "#f59e0b"],
        "fill-opacity": 0.16,
      },
    }, beforeId);
    map.addLayer({
      id: "station-zones-line",
      type: "line",
      source: "station-zones",
      paint: {
        "line-color": ["match", ["get", "risk"], "high", "#dc2626", "#d97706"],
        "line-width": 1.5,
        "line-opacity": 0.7,
      },
    }, beforeId);
  } else {
    map.getSource("station-zones").setData(data);
  }
}

// Positron is almost monochrome by design. These paint tweaks keep the paper
// white feel while restoring a readable blue river and green parks.
const LIGHT_TINT = {
  background: "#f8f9f7",
  water: "#cde4f1",
  waterway: "#a6cbe1",
  park: "#dcecd6",
  landcover_wood: "#ddeed8",
  landcover_grass: "#e4f0de",
  landuse_residential: "#f2f2ee",
  building: "#ecece7",
  highway_major_casing: "#d5d6d0",
  highway_motorway_casing: "#d5d6d0",
  highway_minor: "#e2e3dd",
  boundary_3: "#c5c9c5",
};

function applyLightTint(map) {
  Object.entries(LIGHT_TINT).forEach(([id, color]) => {
    const layer = map.getLayer(id);
    if (!layer) return;
    if (layer.type === "background") map.setPaintProperty(id, "background-color", color);
    else if (layer.type === "fill") map.setPaintProperty(id, "fill-color", color);
    else map.setPaintProperty(id, "line-color", color);
  });
}

export default function FloodMap({
  stations = [],
  selectedStation,
  onSelectStation,
  region,
  basemap = "map",
  onBasemapChange,
  flyRequest,
  t,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const stationsRef = useRef(stations);
  const userMarkerRef = useRef(null);
  const appliedBasemapRef = useRef(basemap);
  const loadedRef = useRef(false);
  const [mapError, setMapError] = useState(null);
  const [zoom, setZoom] = useState(region?.zoom || 11);
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState(null);

  stationsRef.current = stations;

  /* ----------------------------- init ----------------------------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: basemap === "satellite" ? SATELLITE_STYLE : POSITRON_STYLE,
        center: region?.center || [69.1389, 54.8753],
        zoom: region?.zoom || 11.8,
        minZoom: 3,
        maxZoom: 18,
        attributionControl: { compact: true },
      });
    } catch (error) {
      setMapError(error?.message || "Map could not be initialised");
      return undefined;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-right");

    map.on("load", () => {
      loadedRef.current = true;
      updateDangerZones(map, stationsRef.current);
    });
    map.on("style.load", () => {
      applyLightTint(map);
      updateDangerZones(map, stationsRef.current);
    });

    const onZoom = () => {
      const currentZoom = map.getZoom();
      setZoom(currentZoom);
      markersRef.current.forEach((entry) => {
        if (entry.label) {
          entry.label.style.opacity =
            currentZoom >= 11.5 || entry.selected ? "1" : "0";
          entry.label.style.pointerEvents = "none";
        }
      });
    };
    map.on("zoom", onZoom);
    map.on("error", (event) => {
      if (!map.loaded()) setMapError(event?.error?.message || "Map tiles unavailable");
    });

    const observer = new ResizeObserver(() => {
      try {
        map.resize();
      } catch {
        /* map may already be disposed */
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      loadedRef.current = false;
      markersRef.current.forEach((entry) => entry.marker.remove());
      markersRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; region/basemap changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------- basemap toggle ----------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedBasemapRef.current === basemap) return;
    appliedBasemapRef.current = basemap;
    map.setStyle(basemap === "satellite" ? SATELLITE_STYLE : POSITRON_STYLE);
    // setStyle does not re-fire "style.load" in maplibre 4, so retint here.
    if (basemap !== "satellite") map.once("styledata", () => applyLightTint(map));
  }, [basemap]);

  /* --------------------------- station markers -------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const seen = new Set();

    stations.forEach((station) => {
      const id = String(station.id);
      seen.add(id);
      const risk = stationRisk(station);
      const meta = riskMeta(risk);
      const health = normalizeHealth(station.health);
      const offline = health === "offline";
      const selected = selectedStation && String(selectedStation.id) === id;

      if (existing.has(id)) {
        const entry = existing.get(id);
        // Keep MapLibre's own classes: overwriting className removes
        // "maplibregl-marker" (position:absolute) and makes markers drift.
        entry.element.classList.remove(
          "risk-high",
          "risk-medium",
          "risk-low",
          "risk-unknown",
          "health-online",
          "health-stale",
          "health-offline",
          "health-error",
          "is-selected"
        );
        entry.element.classList.add(`risk-${risk}`, `health-${health}`);
        if (selected) entry.element.classList.add("is-selected");
        entry.element.dataset.risk = risk;
        entry.dot.style.background = offline ? "#94a3b8" : meta.hex;
        entry.label.textContent = station.name;
        entry.element.title = `${station.name} — ${health}`;
        entry.label.style.opacity = map.getZoom() >= 11.5 || selected ? "1" : "0";
        entry.label.classList.toggle("is-selected", Boolean(selected));
        entry.selected = Boolean(selected);
        return;
      }

      const element = document.createElement("button");
      element.type = "button";
      element.className = `saqta-station-marker risk-${risk} health-${health}${selected ? " is-selected" : ""}`;
      element.dataset.risk = risk;
      element.title = `${station.name} — ${health}`;

      const pulse = document.createElement("span");
      pulse.className = "saqta-station-pulse";
      const dot = document.createElement("span");
      dot.className = "saqta-station-dot";
      dot.style.background = offline ? "#94a3b8" : meta.hex;
      const label = document.createElement("span");
      label.className = `saqta-station-label${selected ? " is-selected" : ""}`;
      label.textContent = station.name;
      label.style.opacity = map.getZoom() >= 11.5 || selected ? "1" : "0";

      element.append(pulse, dot, label);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectStation?.(station);
      });

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([Number(station.lng), Number(station.lat)])
        .addTo(map);

      existing.set(id, {
        marker,
        element,
        dot,
        label,
        selected: Boolean(selected),
      });
    });

    existing.forEach((entry, id) => {
      if (!seen.has(id)) {
        entry.marker.remove();
        existing.delete(id);
      }
    });

    updateDangerZones(map, stations);
  }, [stations, selectedStation, onSelectStation]);

  /* ---------------------------- fly to ---------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyRequest) return;
    const center = flyRequest.center;
    if (!Array.isArray(center) || center.length !== 2) return;
    map.flyTo({
      center,
      zoom: flyRequest.zoom ?? Math.max(map.getZoom(), 12.5),
      duration: 950,
      essential: true,
    });
    // flyRequest.ts makes repeated requests to the same target work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyRequest?.ts]);

  /* -------------------------- initial region ---------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !region) return;
    if (!flyRequest) {
      map.jumpTo({ center: region.center, zoom: region.zoom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.id]);

  /* --------------------- fit region stations ---------------------- */
  // A region switch should show every station, not only the auto-selected one.
  const fittedRegionRef = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stations.length) return;

    // Skip the brief render where the new region is selected but the previous
    // region's stations are still in state: fitting them would zoom out to the
    // wrong bounds and the later fit would be ignored by the key check.
    if (region?.name && stations.some((station) => station.region !== region.name)) return;

    const key = `${region?.id}:${stations.map((station) => station.id).join(",")}`;
    if (fittedRegionRef.current === key) return;
    fittedRegionRef.current = key;

    const coordinates = stations
      .map((station) => [Number(station.lng), Number(station.lat)])
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    if (coordinates.length < 2) return;

    const bounds = coordinates.reduce(
      (acc, [lng, lat]) => acc.extend([lng, lat]),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 120, left: 70, right: 70 },
      maxZoom: region?.zoom ?? 12,
      duration: 800,
    });
  }, [region?.id, region?.zoom, stations]);

  /* --------------------------- selection -------------------------- */
  // No auto-centering here: a deliberate selection already issues a flyTo via
  // `flyRequest`, and an automatic region selection must not fight `fitBounds`.

  /* --------------------------- geolocation ------------------------ */
  useEffect(() => {
    if (!geoMessage) return undefined;
    const timer = setTimeout(() => setGeoMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [geoMessage]);

  const locateUser = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      setGeoMessage(t("map.geoUnsupported"));
      return;
    }

    setLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lngLat = [position.coords.longitude, position.coords.latitude];

        userMarkerRef.current?.remove();
        const element = document.createElement("div");
        element.className = "saqta-user-marker";
        const dot = document.createElement("span");
        dot.className = "saqta-user-dot";
        const label = document.createElement("span");
        label.className = "saqta-user-label";
        label.textContent = t("map.youAreHere");
        element.append(dot, label);

        userMarkerRef.current = new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat(lngLat)
          .addTo(map);
        map.flyTo({ center: lngLat, zoom: 14, duration: 1200 });
      },
      () => {
        setLocating(false);
        setGeoMessage(t("map.geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !region) return;
    map.flyTo({ center: region.center, zoom: region.zoom, duration: 900 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/95 p-6 text-center">
          <div className="max-w-sm">
            <Layers className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">{mapError}</p>
            <p className="mt-1 text-xs text-slate-500">{t("common.error")}</p>
          </div>
        </div>
      )}

      {/* Basemap switch */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-md shadow-slate-900/5 backdrop-blur">
        <button
          type="button"
          onClick={() => onBasemapChange?.("map")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
            basemap === "map" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          {t("map.map")}
        </button>
        <button
          type="button"
          onClick={() => onBasemapChange?.("satellite")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
            basemap === "satellite" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Satellite className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("map.satellite")}</span>
        </button>
      </div>

      {/* Locate me + reset view */}
      <div className="absolute left-3 top-16 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={locateUser}
          disabled={locating}
          title={t("map.locate")}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 shadow-md shadow-slate-900/5 backdrop-blur transition hover:text-sky-600 disabled:cursor-wait ${
            locating ? "animate-pulse text-sky-600" : "text-slate-600"
          }`}
        >
          <Navigation className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title={t("map.reset")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 text-slate-600 shadow-md shadow-slate-900/5 backdrop-blur transition hover:text-emerald-600"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {geoMessage && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900/85 px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-lg">
          {geoMessage}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 right-3 z-10 hidden items-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-md shadow-slate-900/5 backdrop-blur md:flex md:bottom-9">
        <span className="hidden sm:inline">{t("map.legend")}</span>
        {[
          ["low", "bg-emerald-500"],
          ["medium", "bg-amber-500"],
          ["high", "bg-red-500"],
        ].map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {t(`map.${key}`)}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-[62px] right-3 z-10 hidden max-w-[280px] rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-[9px] leading-4 text-slate-500 shadow-sm backdrop-blur md:block">
        {t("map.zoneNote")}
      </div>

      {zoom < 10.5 && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-medium text-white">
          {t("map.station")}
        </div>
      )}
    </div>
  );
}
