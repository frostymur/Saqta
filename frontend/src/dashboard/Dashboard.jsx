import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Droplets } from "lucide-react";
import LoginModal from "../components/LoginModal";
import { decideAlert, sendAlertTelegram } from "../api";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import FloodMap from "./FloodMap";
import StationPanel from "./StationPanel";
import AlertsCenter from "./AlertsCenter";
import OperatorQueue from "./OperatorQueue";
import OperatorStats from "./OperatorStats";
import OperatorLogs from "./OperatorLogs";
import TelemetryLogs from "./TelemetryLogs";
import ReportsView from "./ReportsView";
import AboutView from "./AboutView";
import StationsView from "./StationsView";
import ProfileView from "./ProfileView";
import MobileTabBar from "./MobileTabBar";
import Toasts from "./Toasts";
import { StationDetailsModal } from "./InfoModal";
import { getRegionById, getRegionByName } from "./data/dashboardRegions";
import { createT } from "./data/dashboardI18n";
import { useLiveData } from "./hooks/useLiveData";
import { healthLabelKey, highestRiskStation } from "./lib/format";
import { notifyPublishedAlert } from "./lib/notifications";

export default function Dashboard({
  currentLang = "ru",
  onSelectLang,
  currentUser = null,
  onLoginSuccess,
  onLogout,
}) {
  const t = useMemo(() => createT(currentLang), [currentLang]);
  const [view, setView] = useState("map");
  const [reportsNonce, setReportsNonce] = useState(0);
  const [regionId, setRegionId] = useState(() => {
    try {
      return localStorage.getItem("saqta_region") || "sko";
    } catch {
      return "sko";
    }
  });
  const region = useMemo(() => getRegionById(regionId), [regionId]);

  const [selectedCase, setSelectedCase] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [basemap, setBasemap] = useState("map");
  const [flyRequest, setFlyRequest] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [details, setDetails] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busyDecisions, setBusyDecisions] = useState(() => new Set());

  const pendingStationRef = useRef(null);
  const toastTimersRef = useRef(new Map());

  const isOperator = Boolean(currentUser && ["operator", "admin"].includes(currentUser.role));
  const roleLabel = !currentUser
    ? t("role.guest")
    : currentUser.role === "operator"
    ? t("role.operator")
    : currentUser.role === "admin"
    ? t("role.admin")
    : t("role.user");

  /* ----------------------------- toasts ---------------------------- */
  const pushToast = useCallback((message, type = "success") => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      toastTimersRef.current.delete(id);
    }, 6000);
    toastTimersRef.current.set(id, timer);
  }, []);

  useEffect(
    () => () => {
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current.clear();
    },
    []
  );

  /* --------------------------- live data --------------------------- */
  const handleNewPublished = useCallback(
    (alert) => {
      pushToast(t("toast.newAlert", { station: alert?.station_name || "" }), "warning");
      notifyPublishedAlert(alert, currentLang);
    },
    [currentLang, pushToast, t]
  );

  const handleNewPending = useCallback(
    (alert) => {
      pushToast(t("toast.operatorPending", { station: alert?.station_name || "" }), "info");
    },
    [pushToast, t]
  );

  const handleStationStatus = useCallback(
    (payload) => {
      if (!isOperator) return;
      if (!payload?.health || payload.health === "online") return;
      const station = payload.station_name || t("alerts.station");
      pushToast(
        `${station}: ${t(healthLabelKey(payload.health))}`,
        payload.health === "offline" ? "error" : "warning"
      );
    },
    [isOperator, pushToast, t]
  );

  const {
    stations,
    publicAlerts,
    pendingAlerts,
    setPendingAlerts,
    stats,
    logs,
    loading,
    alertsLoading,
    error,
    connected,
    refresh,
  } = useLiveData({
    regionName: region.name,
    isOperator,
    onNewPublished: handleNewPublished,
    onNewPending: handleNewPending,
    onStationStatus: handleStationStatus,
  });

  const selectedStation = useMemo(() => {
    if (selectedCase == null) return null;
    return stations.find((station) => String(station.id) === String(selectedCase)) || null;
  }, [stations, selectedCase]);

  useEffect(() => {
    try {
      localStorage.setItem("saqta_region", regionId);
    } catch {
      /* ignore */
    }
  }, [regionId]);

  /* Pick a station after the region list loads. */
  useEffect(() => {
    if (!stations.length) return;

    if (pendingStationRef.current != null) {
      const found = stations.find(
        (station) => String(station.id) === String(pendingStationRef.current)
      );
      pendingStationRef.current = null;
      if (found) {
        setSelectedCase(String(found.id));
        return;
      }
    }

    setSelectedCase((previous) => {
      if (previous && stations.some((station) => String(station.id) === String(previous))) {
        return previous;
      }
      const best = highestRiskStation(stations);
      return best ? String(best.id) : null;
    });
  }, [stations]);

  /* --------------------------- navigation -------------------------- */
  const changeRegion = useCallback(
    (nextRegionId) => {
      const nextRegion = getRegionById(nextRegionId);
      setRegionId(nextRegionId);
      setSelectedCase(null);
      pendingStationRef.current = null;
      setPanelOpen(false);
      setView("map");
      setFlyRequest({
        center: nextRegion.center,
        zoom: nextRegion.zoom,
        ts: Date.now(),
      });
    },
    []
  );

  const selectStation = useCallback(
    (station, { openPanel = true } = {}) => {
      if (!station) return;
      const targetRegion = getRegionByName(station.region);
      const lng = Number(station.lng);
      const lat = Number(station.lat);

      if (targetRegion && targetRegion.id !== regionId) {
        pendingStationRef.current = station.id;
        setRegionId(targetRegion.id);
        setSelectedCase(null);
      } else {
        setSelectedCase(String(station.id));
      }

      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        setFlyRequest({
          center: [lng, lat],
          zoom: Math.max(region.zoom, 12.6),
          ts: Date.now(),
        });
      }

      setView("map");
      setPanelOpen(openPanel);
    },
    [region.zoom, regionId]
  );

  const focusAlert = useCallback(
    (alert) => {
      if (!alert) return;
      const targetRegion = getRegionByName(alert.station_region);
      if (targetRegion && targetRegion.id !== regionId) {
        pendingStationRef.current = alert.station_id;
        setRegionId(targetRegion.id);
        setSelectedCase(null);
      } else if (alert.station_id != null) {
        setSelectedCase(String(alert.station_id));
      }

      const lng = Number(alert.station_lng);
      const lat = Number(alert.station_lat);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        setFlyRequest({ center: [lng, lat], zoom: 12.8, ts: Date.now() });
      } else if (targetRegion) {
        setFlyRequest({ center: targetRegion.center, zoom: targetRegion.zoom, ts: Date.now() });
      }

      setView("map");
      setPanelOpen(true);
    },
    [regionId]
  );

  const navigateView = useCallback((nextView) => {
    setView(nextView);
    if (nextView === "reports") setReportsNonce((value) => value + 1);
    if (nextView !== "map") {
      setPanelOpen(false);
    }
  }, []);

  /* --------------------------- operator ---------------------------- */
  const handleDecision = useCallback(
    async (alert, action) => {
      if (!alert) return;
      setPendingAlerts((previous) => previous.filter((item) => String(item.id) !== String(alert.id)));
      setBusyDecisions((previous) => new Set(previous).add(alert.id));
      try {
        await decideAlert(alert.id, action, currentUser?.full_name || currentUser?.email || "Operator");
        pushToast(
          action === "approve" ? t("alerts.approvedToast") : t("alerts.declinedToast"),
          "success"
        );
        refresh();
      } catch (decisionError) {
        setPendingAlerts((previous) =>
          previous.some((item) => String(item.id) === String(alert.id)) ? previous : [alert, ...previous]
        );
        pushToast(decisionError?.message || t("alerts.errorToast"), "error");
      } finally {
        setBusyDecisions((previous) => {
          const next = new Set(previous);
          next.delete(alert.id);
          return next;
        });
      }
    },
    [currentUser, pushToast, refresh, setPendingAlerts, t]
  );

  const handleTelegram = useCallback(
    async (alert) => {
      try {
        await sendAlertTelegram(alert.id);
        pushToast(t("alerts.telegramSent"), "success");
      } catch (telegramError) {
        pushToast(telegramError?.message || t("alerts.errorToast"), "error");
      }
    },
    [pushToast, t]
  );

  const handleLoginSuccess = useCallback(
    (user) => {
      onLoginSuccess?.(user);
      const nextRole =
        user?.role === "operator"
          ? t("role.operator")
          : user?.role === "admin"
          ? t("role.admin")
          : t("role.user");
      pushToast(t("toast.welcome", { role: nextRole }), "success");
      setLoginOpen(false);
    },
    [onLoginSuccess, pushToast, t]
  );

  /* ----------------------------- render ---------------------------- */
  const selectedForPanel = selectedStation;

  return (
    <div
      className="dashboard-root flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-800"
      style={{ height: "100dvh" }}
    >
      <DashboardHeader
        t={t}
        lang={currentLang}
        onSelectLang={onSelectLang}
        user={currentUser}
        roleLabel={roleLabel}
        regionId={regionId}
        onSelectRegion={changeRegion}
        stations={stations}
        onSelectStation={selectStation}
        alerts={publicAlerts}
        onSelectAlert={focusAlert}
        onViewAlerts={() => navigateView("alerts")}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={onLogout}
        onOpenProfile={() => navigateView("profile")}
        onLogoClick={() => navigateView("map")}
        connected={connected}
      />

      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          view={view}
          onNavigate={navigateView}
          isOperator={isOperator}
          pendingCount={pendingAlerts.length}
          user={currentUser}
          roleLabel={roleLabel}
          t={t}
        />

        <main className="relative min-w-0 flex-1 overflow-hidden">
          {view === "map" ? (
            <div className="relative h-full w-full">
              <FloodMap
                stations={stations}
                selectedStation={selectedStation}
                onSelectStation={(station) => selectStation(station)}
                region={region}
                basemap={basemap}
                onBasemapChange={setBasemap}
                flyRequest={flyRequest}
                t={t}
              />

              {/* Mobile station action */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end gap-2 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
                {selectedStation && (
                  <button
                    type="button"
                    onClick={() => setPanelOpen(true)}
                    className="pointer-events-auto ml-auto inline-flex h-10 min-w-0 max-w-[58%] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[10px] font-semibold text-white shadow-lg"
                  >
                    <Droplets className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedStation.name}</span>
                  </button>
                )}
              </div>

              {/* Tablet/desktop drawer reopen */}
              {selectedStation && !panelOpen && (
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className="absolute right-3 top-[60px] z-20 hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-700 shadow-lg backdrop-blur md:inline-flex xl:hidden"
                >
                  <Droplets className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="max-w-[150px] truncate">{selectedStation.name}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain p-3 pb-20 sm:p-5 md:pb-6">
              {view === "stations" && (
                <StationsView
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={selectStation}
                  region={region}
                  loading={loading}
                  isOperator={isOperator}
                  onStationCreated={refresh}
                  onStationDeleted={refresh}
                  onToast={pushToast}
                  t={t}
                  lang={currentLang}
                />
              )}

              {view === "alerts" && (
                <AlertsCenter
                  alerts={publicAlerts}
                  loading={alertsLoading}
                  t={t}
                  lang={currentLang}
                  onSelectAlert={focusAlert}
                  onSendTelegram={handleTelegram}
                  isOperator={isOperator}
                />
              )}

              {view === "reports" && (
                <ReportsView
                  key={reportsNonce}
                  t={t}
                  lang={currentLang}
                  regionName={region?.name || null}
                  regionLabel={region?.shortName || null}
                  initialOpen
                />
              )}

              {view === "about" && <AboutView t={t} onNavigate={navigateView} />}

              {view === "profile" && (
                <ProfileView
                  user={currentUser}
                  roleLabel={roleLabel}
                  currentLang={currentLang}
                  onSelectLang={onSelectLang}
                  regionId={regionId}
                  onSelectRegion={changeRegion}
                  onLoginClick={() => setLoginOpen(true)}
                  onLogout={onLogout}
                  t={t}
                />
              )}

              {view === "queue" &&
                (isOperator ? (
                  <OperatorQueue
                    pending={pendingAlerts}
                    onDecide={handleDecision}
                    busyIds={busyDecisions}
                    onSelectAlert={focusAlert}
                    onToast={pushToast}
                    t={t}
                    lang={currentLang}
                  />
                ) : (
                  <AlertsCenter
                    alerts={publicAlerts}
                    loading={alertsLoading}
                    t={t}
                    lang={currentLang}
                    onSelectAlert={focusAlert}
                  />
                ))}

              {view === "stats" &&
                (isOperator ? (
                  <OperatorStats
                    stats={stats}
                    loading={loading || alertsLoading}
                    error={error}
                    onRefresh={refresh}
                    t={t}
                  />
                ) : (
                  <AlertsCenter
                    alerts={publicAlerts}
                    loading={alertsLoading}
                    t={t}
                    lang={currentLang}
                    onSelectAlert={focusAlert}
                  />
                ))}

              {view === "logs" &&
                (isOperator ? (
                  <OperatorLogs
                    logs={logs}
                    loading={loading}
                    onRefresh={refresh}
                    t={t}
                    lang={currentLang}
                  />
                ) : (
                  <AlertsCenter
                    alerts={publicAlerts}
                    loading={alertsLoading}
                    t={t}
                    lang={currentLang}
                    onSelectAlert={focusAlert}
                  />
                ))}

              {view === "telemetry" &&
                (isOperator ? (
                  <TelemetryLogs
                    stations={stations}
                    region={region}
                    t={t}
                    lang={currentLang}
                  />
                ) : (
                  <AlertsCenter
                    alerts={publicAlerts}
                    loading={alertsLoading}
                    t={t}
                    lang={currentLang}
                    onSelectAlert={focusAlert}
                  />
                ))}
            </div>
          )}
        </main>

        {view === "map" && (
          <aside className="hidden w-[380px] shrink-0 flex-col border-l border-slate-100 bg-white xl:flex">
            <StationPanel
              station={selectedForPanel}
              region={region}
              publicAlerts={publicAlerts}
              isOperator={isOperator}
              onViewDetails={(station, prediction) => setDetails({ station, prediction })}
              onViewAlerts={() => navigateView("alerts")}
              t={t}
              lang={currentLang}
            />
          </aside>
        )}
      </div>

      <MobileTabBar
        view={view}
        onNavigate={navigateView}
        t={t}
        alertCount={isOperator ? pendingAlerts.length : 0}
      />

      {/* Station panel drawer / bottom sheet (below xl) */}
      {panelOpen && (
        <div className="fixed inset-0 z-[65] xl:hidden">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 h-[82dvh] overflow-hidden rounded-t-2xl bg-white shadow-2xl md:inset-x-auto md:right-0 md:top-14 md:bottom-0 md:h-auto md:w-[380px] md:rounded-none md:border-l md:border-slate-100 lg:top-16"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <StationPanel
              station={selectedForPanel}
              region={region}
              publicAlerts={publicAlerts}
              isOperator={isOperator}
              onViewDetails={(station, prediction) => setDetails({ station, prediction })}
              onViewAlerts={() => {
                setPanelOpen(false);
                navigateView("alerts");
              }}
              onClose={() => setPanelOpen(false)}
              t={t}
              lang={currentLang}
            />
          </div>
        </div>
      )}

      <StationDetailsModal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        station={details?.station}
        prediction={details?.prediction}
        t={t}
        lang={currentLang}
      />

      <Toasts
        toasts={toasts}
        onDismiss={(id) => {
          setToasts((previous) => previous.filter((toast) => toast.id !== id));
          const timer = toastTimersRef.current.get(id);
          if (timer) window.clearTimeout(timer);
          toastTimersRef.current.delete(id);
        }}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentLang={currentLang}
      />
    </div>
  );
}
