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

## 🔐 Переменные окружения (обязательно для APK/IPA)

Веб-версия на Render ходит в API по относительному `/api`. Внутри Capacitor
приложение открывается с `https://localhost`, поэтому относительный путь
попадёт в никуда. Перед сборкой мобильного бандла нужно указать публичный API:

```bash
cd frontend
cp .env.mobile.example .env.mobile
```

`frontend/.env.mobile`:

```env
VITE_API_BASE=https://saqta.onrender.com/api
VITE_WS_URL=wss://saqta.onrender.com/ws
```

Правила:

- `.env.mobile` читается командой `npm run build:mobile`;
- после изменения URL нужно пересобрать веб-часть и сделать `npx cap sync`;
- всё с префиксом `VITE_` **попадает внутрь APK/IPA и читается любым человеком**;
- не кладите туда пароли, JWT-секреты, ключи Telegram или доступы к БД;
- backend `.env` к мобильному приложению отношения не имеет — приложению нужен только публичный URL API.

Секреты подписи Android (`*.jks`, `*.keystore`) и локальные `.env` уже добавлены в `.gitignore`.

---

## ⚡ Быстрые команды (NPM Scripts)

Все команды запускаются из папки `frontend`:

```bash
cd /home/timur/projects/saqta/frontend

# 1. Собрать мобильную веб-версию с .env.mobile и синхронизировать нативный код
npm run cap:build:mobile

# 2. Собрать debug APK (нужны JDK 17+ и Android SDK)
npm run android:apk

# 3. Только синхронизация веб-ассетов и плагинов
npm run cap:sync

# 4. Открыть нативный проект в Android Studio
npm run cap:open:android

# 5. Запустить приложение на подключенном Android устройстве / эмуляторе
npm run cap:run:android

# 6. Для iOS (только на macOS с Xcode):
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

Если установлен JDK 17+ и Android SDK:

```bash
cd /home/timur/projects/saqta/frontend
cp .env.mobile.example .env.mobile
npm run cap:build:mobile
npm run android:apk
```

Либо вручную:

```bash
cd /home/timur/projects/saqta/frontend/android
./gradlew assembleDebug
```

APK будет скомпилирован по пути:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

Это **debug APK**: его можно сразу отправить другу, он ставится через
«Установить из неизвестного источника». Для Google Play нужен подписанный
`release` AAB — см. раздел «Подпись Android».

---

## 🍏 Сборка для iOS (только macOS + Xcode)

iOS нельзя собрать на Linux/Windows. Нужен Mac с Xcode.

1. Установите платформу iOS (один раз):
   ```bash
   cd /home/timur/projects/saqta/frontend
   cp .env.mobile.example .env.mobile
   npm run build:mobile
   npx cap add ios
   npx cap sync ios
   ```
2. Откройте проект в Xcode:
   ```bash
   npm run cap:open:ios
   ```
3. В Xcode выберите Signing Team и Bundle Identifier `kz.saqta.app`.
4. Для запуска на своём iPhone: **Run** (Cmd + R).
5. Для друга: **Product → Archive → Distribute App**.
   - **TestFlight** — друг ставит TestFlight и принимает приглашение;
   - **Ad Hoc** — нужен UDID iPhone друга и paid Apple Developer;
   - **App Store** — публичная публикация.

Без платного Apple Developer Program ($99/год) отдать IPA другу нельзя.
Бесплатная подпись работает только на вашем подключённом iPhone и живёт 7 дней.
Для быстрой демонстрации без Apple-аккаунта проще открыть сайт как PWA:
`https://saqta.onrender.com` → «Добавить на экран Домой».

---

## 🔑 Подпись Android (release)

Debug APK подписан автоматически отладочным ключом — для теста другу этого
достаточно. Для Google Play нужен свой keystore:

```bash
cd frontend/android
keytool -genkey -v -keystore saqta-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias saqta
```

Дальше добавьте `signingConfigs` в `android/app/build.gradle` или используйте
Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
Файлы `*.jks` и `*.keystore` не коммитьте.

```bash
./gradlew bundleRelease   # AAB для Google Play
./gradlew assembleRelease # подписанный APK, если настроен signingConfig
```

Выход:

- `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- `frontend/android/app/build/outputs/apk/release/app-release.apk`
- `frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

## 📤 Как отдать другу

### Android без локального Android SDK (GitHub Actions)

В репозитории есть workflow `.github/workflows/android-apk.yml`.
Он собирает debug APK на Ubuntu-раннере:

1. GitHub → **Actions** → **Build Android APK** → **Run workflow**.
2. Дождитесь зелёной галочки.
3. Внизу страницы запуска скачайте артефакт `saqta-debug-apk`.
4. Внутри — `app-debug.apk`, его можно сразу отправить другу.

API URL зашит в workflow: `https://saqta.onrender.com`. Если бэкенд
переедет, поменяйте `VITE_API_BASE` и `VITE_WS_URL` в workflow.

### Android локально

1. Соберите `app-debug.apk`.
2. Отправьте файл в Telegram/Google Drive.
3. Друг открывает APK и разрешает установку из неизвестного источника.
4. При обновлении версии старый APK удалять не обязательно — подпись та же.

### iOS

- **TestFlight** — самый нормальный вариант: нужен paid Apple Developer,
  TestFlight-приглашение и установка приложения TestFlight.
- **Ad Hoc IPA** — нужен UDID устройства друга и paid-аккаунт.
- **Без аккаунта** — только PWA через Safari: «Поделиться → На экран Домой».

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
