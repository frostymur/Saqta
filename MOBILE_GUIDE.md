# Руководство по сборке мобильного приложения Saqta.kz (Capacitor)

Платформа **Saqta.kz** настроена с использованием **Capacitor 8** для быстрой кроссплатформенной сборки в нативные мобильные приложения для **Android** (APK / Google Play) и **iOS** (App Store).

---

## 📱 Конфигурация проекта

- **App ID (Package Name):** `kz.saqta.app`
- **App Name:** `Saqta.kz`
- **Web Directory:** `dist`
- **Файл настроек:** `frontend/capacitor.config.json`
- **Плагины:**
  - `@capacitor/status-bar` (нативная темная/светлая строка состояния)
  - `@capacitor/splash-screen` (автоматический экран загрузки)

---

## ⚡ Быстрые команды (NPM Scripts)

Все команды запускаются из папки `frontend`:

```bash
cd /home/timur/projects/saqta/frontend

# 1. Собрать веб-версию и синхронизировать с нативным кодом
npm run cap:build

# 2. Только синхронизация веб-ассетов и плагинов
npm run cap:sync

# 3. Открыть нативный проект в Android Studio
npm run cap:open:android

# 4. Запустить приложение на подключенном Android устройстве / эмуляторе
npm run cap:run:android

# 5. Для iOS (на macOS с Xcode):
npm run cap:add:ios      # Добавить платформу iOS
npm run cap:open:ios     # Открыть в Xcode
```

---

## 🤖 Сборка APK для Android

### Вариант 1: Через Android Studio (Визуально)

1. Выполните команду:
   ```bash
   cd /home/timur/projects/saqta/frontend
   npm run cap:open:android
   ```
2. Android Studio автоматически откроет директорию `frontend/android`.
3. Дождитесь завершения синхронизации Gradle.
4. В верхнем меню выберите:
   - **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
5. Готовый файл APK появится в папке:
   `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

### Вариант 2: Сборка через консоль (Gradle CLI)

Если установлен Android SDK:

```bash
cd /home/timur/projects/saqta/frontend/android
./gradlew assembleDebug
```
APK будет скомпилирован по пути:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🍏 Сборка для iOS (macOS + Xcode)

1. Установите платформу iOS (один раз):
   ```bash
   cd /home/timur/projects/saqta/frontend
   npm run cap:add:ios
   ```
2. Откройте проект в Xcode:
   ```bash
   npm run cap:open:ios
   ```
3. В Xcode выберите команду разработчика (Signing Team) и нажмите **Run** (Cmd + R) для запуска на iPhone или симуляторе.

---

## 🔄 Live Reload во время мобильной разработки

Для мгновенного тестирования изменений на физическом телефоне без постоянной пересборки:

1. Узнайте локальный IP вашего компьютера (например, `192.168.1.100`).
2. В `frontend/capacitor.config.json` временно добавьте блок `server.url`:
   ```json
   {
     "appId": "kz.saqta.app",
     "appName": "Saqta.kz",
     "webDir": "dist",
     "server": {
       "url": "http://192.168.1.100:5173",
       "cleartext": true
     }
   }
   ```
3. Запустите dev-сервер:
   ```bash
   npm run dev -- --host
   ```
4. Выполните `npx cap sync`, и мобильное приложение будет мгновенно обновляться при изменении кода на компьютере.
