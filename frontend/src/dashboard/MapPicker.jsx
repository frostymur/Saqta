import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";

/**
 * Small coordinate picker used by the add-station form. Click the map or drag
 * the pin; the parent form receives decimal degrees.
 */
export default function MapPicker({ lat, lng, region, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: POSITRON_STYLE,
      center: [Number(lng) || region?.center?.[0] || 69.1389, Number(lat) || region?.center?.[1] || 54.8753],
      zoom: 11,
      minZoom: 3,
      maxZoom: 17,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const marker = new maplibregl.Marker({ draggable: true, color: "#059669" })
      .setLngLat([
        Number(lng) || region?.center?.[0] || 69.1389,
        Number(lat) || region?.center?.[1] || 54.8753,
      ])
      .addTo(map);
    markerRef.current = marker;

    const emit = (lngLat) => {
      onChangeRef.current?.(Number(lngLat.lat.toFixed(6)), Number(lngLat.lng.toFixed(6)));
    };
    map.on("click", (event) => {
      marker.setLngLat(event.lngLat);
      emit(event.lngLat);
    });
    marker.on("dragend", () => emit(marker.getLngLat()));

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once per modal mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const nextLat = Number(lat);
    const nextLng = Number(lng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;
    const current = marker.getLngLat();
    if (Math.abs(current.lat - nextLat) < 1e-6 && Math.abs(current.lng - nextLng) < 1e-6) return;
    marker.setLngLat([nextLng, nextLat]);
    map.easeTo({ center: [nextLng, nextLat], duration: 300 });
  }, [lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !region?.center) return;
    map.jumpTo({ center: region.center, zoom: 11 });
    marker.setLngLat(region.center);
  }, [region?.id]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
    />
  );
}
