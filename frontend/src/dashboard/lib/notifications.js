import { Capacitor } from "@capacitor/core";

let permissionRequested = false;
let plugin = null;

async function getPlugin() {
  if (plugin) return plugin;
  const module = await import("@capacitor/local-notifications");
  plugin = module.LocalNotifications;
  return plugin;
}

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function ensurePermission() {
  if (!isNativeApp()) return false;
  const LocalNotifications = await getPlugin();
  if (!LocalNotifications) return false;

  try {
    let status = await LocalNotifications.checkPermissions();
    if (status.display !== "granted" && !permissionRequested) {
      permissionRequested = true;
      status = await LocalNotifications.requestPermissions();
    }
    return status.display === "granted";
  } catch {
    return false;
  }
}

export async function notifyPublishedAlert(alert, lang = "en") {
  if (!alert || !isNativeApp()) return false;
  try {
    const granted = await ensurePermission();
    if (!granted) return false;
    const LocalNotifications = await getPlugin();
    const numericId = Math.abs(Number(alert.id)) % 2147483646 || Date.now() % 2147483646;
    const levels = {
      ru: { title: "Saqta.kz — экстренное оповещение", body: `Гидропост ${alert.station_name || ""}: риск подтопления. Откройте карту.` },
      kk: { title: "Saqta.kz — шұғыл ескерту", body: `${alert.station_name || "Гидробекет"}: су басу қаупі. Картаны ашыңыз.` },
      en: { title: "Saqta.kz — emergency alert", body: `${alert.station_name || "Station"}: flood risk published. Open the map.` },
    };
    const text = levels[lang] || levels.en;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: numericId,
          title: text.title,
          body: text.body,
          channelId: "saqta-alerts",
          smallIcon: "ic_stat_icon_config_sample",
          schedule: { at: new Date(Date.now() + 400) },
          sound: null,
          extra: { alertId: alert.id, stationId: alert.station_id },
        },
      ],
    });
    return true;
  } catch {
    // Native notifications are a progressive enhancement; never break the web dashboard.
    return false;
  }
}
