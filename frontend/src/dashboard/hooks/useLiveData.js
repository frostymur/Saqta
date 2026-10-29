import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAlertLog,
  fetchAlertStats,
  fetchAlerts,
  fetchPublicAlerts,
  fetchStations,
  websocketUrl,
} from "../../api";

const POLL_MS = 15000;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Keeps stations, published alerts and operator queues in sync.
 * WebSocket is the fast path; a 15s poll is the safety net.
 */
export function useLiveData({
  regionName,
  isOperator,
  onNewPublished,
  onNewPending,
  onConnectionChange,
  onToast,
  onStationStatus,
}) {
  const [stations, setStations] = useState([]);
  const [publicAlerts, setPublicAlerts] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const regionRef = useRef(regionName);
  const operatorRef = useRef(isOperator);
  const callbacksRef = useRef({
    onNewPublished,
    onNewPending,
    onConnectionChange,
    onToast,
    onStationStatus,
  });
  const seenPublishedRef = useRef(new Set());
  const seenPendingRef = useRef(new Set());
  const firstPublishedLoadRef = useRef(true);
  const firstPendingLoadRef = useRef(true);
  const prevRegionRef = useRef(regionName);

  regionRef.current = regionName;
  operatorRef.current = isOperator;
  callbacksRef.current = {
    onNewPublished,
    onNewPending,
    onConnectionChange,
    onToast,
    onStationStatus,
  };

  useEffect(() => {
    callbacksRef.current.onConnectionChange?.(connected);
  }, [connected]);

  useEffect(() => {
    if (prevRegionRef.current !== regionName) {
      prevRegionRef.current = regionName;
      seenPublishedRef.current = new Set();
      seenPendingRef.current = new Set();
      firstPublishedLoadRef.current = true;
      firstPendingLoadRef.current = true;
    }
  }, [regionName]);

  const announcePublished = useCallback((alert) => {
    if (!alert) return;
    const key = String(alert.id);
    if (seenPublishedRef.current.has(key)) return;
    seenPublishedRef.current.add(key);
    callbacksRef.current.onNewPublished?.(alert);
  }, []);

  const announcePending = useCallback((alert) => {
    if (!alert || !operatorRef.current) return;
    const key = String(alert.id);
    if (seenPendingRef.current.has(key)) return;
    seenPendingRef.current.add(key);
    callbacksRef.current.onNewPending?.(alert);
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const region = regionRef.current;
      if (!silent) {
        setLoading(true);
        setAlertsLoading(true);
      }

      const [stationsResult, alertsResult] = await Promise.allSettled([
        fetchStations(region),
        fetchPublicAlerts(region),
      ]);

      if (stationsResult.status === "fulfilled") {
        setStations(asArray(stationsResult.value));
        setError(null);
      } else {
        setError(stationsResult.reason?.message || "Could not load stations");
      }

      if (alertsResult.status === "fulfilled") {
        const list = asArray(alertsResult.value);
        if (firstPublishedLoadRef.current) {
          list.forEach((alert) => seenPublishedRef.current.add(String(alert.id)));
          firstPublishedLoadRef.current = false;
        } else {
          list.forEach((alert) => announcePublished(alert));
        }
        setPublicAlerts(list);
      }
      setLoading(false);
      setAlertsLoading(false);

      if (!operatorRef.current) {
        setPendingAlerts([]);
        return;
      }

      const [pendingResult, statsResult, logResult] = await Promise.allSettled([
        fetchAlerts({ status: "pending", region, limit: 100, auth: true }),
        fetchAlertStats(),
        fetchAlertLog(60),
      ]);

      if (pendingResult.status === "fulfilled") {
        const list = asArray(pendingResult.value);
        if (firstPendingLoadRef.current) {
          list.forEach((alert) => seenPendingRef.current.add(String(alert.id)));
          firstPendingLoadRef.current = false;
        } else {
          list.forEach((alert) => announcePending(alert));
        }
        setPendingAlerts(list);
      }
      if (statsResult.status === "fulfilled") setStats(statsResult.value || null);
      if (logResult.status === "fulfilled") setLogs(asArray(logResult.value));
    },
    [announcePending, announcePublished]
  );

  useEffect(() => {
    load();
  }, [load, regionName, isOperator]);

  useEffect(() => {
    const id = window.setInterval(() => load({ silent: true }), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  /* --------------------------- WebSocket --------------------------- */

  useEffect(() => {
    let socket = null;
    let retryTimer = null;
    let attempt = 0;
    let disposed = false;

    const handleEvent = (message) => {
      const type = message?.type;
      const data = message?.data ?? message?.payload ?? {};
      if (!type) return;

      if (type === "telemetry_update") {
        const stationId = data.station_id ?? data.stationId;
        if (stationId == null) {
          load({ silent: true });
          return;
        }
        setStations((prev) =>
          prev.map((station) =>
            String(station.id) === String(stationId)
              ? {
                  ...station,
                  current_water_level: data.water_level ?? data.current_water_level ?? station.current_water_level,
                  current_rate_of_rise:
                    data.rate_of_rise ?? data.current_rate_of_rise ?? station.current_rate_of_rise,
                  current_risk_level: data.risk_level ?? data.current_risk_level ?? station.current_risk_level,
                  health: data.health ?? station.health,
                  last_updated: data.timestamp ?? station.last_updated,
                }
              : station
          )
        );
        return;
      }

      if (type === "station_status") {
        const stationId = data.station_id ?? data.stationId;
        if (stationId == null) {
          load({ silent: true });
          return;
        }
        setStations((prev) =>
          prev.map((station) =>
            String(station.id) === String(stationId)
              ? {
                  ...station,
                  status: data.status ?? station.status,
                  health: data.health ?? station.health,
                  last_updated: data.last_updated ?? station.last_updated,
                }
              : station
          )
        );
        callbacksRef.current.onStationStatus?.(data);
        return;
      }

      if (type === "pending_alert") {
        if (!operatorRef.current) return;
        const alert = data.alert || data;
        if (!alert?.id) {
          load({ silent: true });
          return;
        }
        if (alert.station_region && alert.station_region !== regionRef.current) return;
        setPendingAlerts((prev) => {
          if (prev.some((item) => String(item.id) === String(alert.id))) return prev;
          return [alert, ...prev];
        });
        announcePending(alert);
        load({ silent: true });
        return;
      }

      if (type === "alert_published") {
        const alert = data.alert || data;
        if (alert?.station_region && alert.station_region !== regionRef.current) return;
        announcePublished(alert);
        load({ silent: true });
        return;
      }

      if (type === "alert_updated" || type === "alert_declined" || type === "alert_processed") {
        load({ silent: true });
      }
    };

    const connect = () => {
      if (disposed) return;
      const url = websocketUrl();
      if (!url) return;
      try {
        socket = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setConnected(true);
        load({ silent: true });
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleEvent(parsed);
        } catch {
          /* ignore malformed frames */
        }
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      attempt += 1;
      const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
      retryTimer = window.setTimeout(connect, delay);
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [announcePending, announcePublished, load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  return {
    stations,
    publicAlerts,
    pendingAlerts,
    setPendingAlerts,
    stats,
    setStats,
    logs,
    loading,
    alertsLoading,
    error,
    connected,
    refresh,
  };
}
