export const FEATURE_UI = {
  kk: {
    back: "Артқа",
    howItWorks: "Бұл қалай жұмыс істейді",
    openMap: "Тікелей картаны ашу",
    ctaTitle: "Мұны тірі режимде көргіңіз келе ме?",
    ctaBody: "Ашық демо-картада станцияларды, телеметрияны және оператордың шешім қабылдауын көріңіз.",
    ctaButton: "Демоны ашу",
  },
  ru: {
    back: "Назад",
    howItWorks: "Как это работает",
    openMap: "Открыть живую карту",
    ctaTitle: "Хотите увидеть это вживую?",
    ctaBody: "Откройте демо-карту: станции, телеметрия и решения оператора в одном интерфейсе.",
    ctaButton: "Открыть демо",
  },
  en: {
    back: "Back",
    howItWorks: "How it works",
    openMap: "Open live map",
    ctaTitle: "Want to see it live?",
    ctaBody: "Open the demo map to explore stations, telemetry and the operator decision flow.",
    ctaButton: "Open demo",
  },
};

export const FEATURE_PAGES = {
  kk: {
    iot: {
      kicker: "IoT сенсорлық желісі",
      title: "Шағын өзендердегі автономды гидробекеттер",
      intro:
        "Бекет су деңгейін 1–5 минут сайын өлшейді, байланыс үзілгенде деректерді буферге жазады және MQTT арқылы телеметрия жібереді. Қуат — күн панелі, корпус — IP67.",
      stats: [
        { value: "1–5 мин", label: "өлшеу интервалы" },
        { value: "24–72 сағ", label: "байланыссыз буфер" },
        { value: "IP67", label: "корпус қорғанысы" },
      ],
      sections: [
        {
          title: "Бекет не өлшейді",
          body: "Негізгі арна — су деңгейі. Оған станцияның өмір сүруін бақылайтын қызметтік көрсеткіштер қосылады.",
          bullets: [
            "су деңгейі және датчикке дейінгі қашықтық",
            "су деңгейінің көтерілу жылдамдығы, см/сағ",
            "жауын-шашын және ауа температурасы",
            "АКБ кернеуі, күн панелі және сигнал деңгейі",
            "датчик қатесі мен байланыс күйі",
          ],
        },
        {
          title: "Деректер қалай жетеді",
          body: "Контроллер көрсеткіштерді сүзеді, орташалайды және MQTT-ге жібереді. Байланыс болмаса, өлшемдер жергілікті буферде қалады да, байланыс қалпына келгенде қайта жіберіледі.",
          bullets: [
            "MQTT немесе HTTPS, TLS қолдауы",
            "Last Will арқылы online/offline күйі",
            "қалыпты режимде 5–15 минут сайын жіберу",
            "қауіп кезінде 1–2 минут сайын жіберу",
          ],
        },
        {
          title: "Қайда орнату керек",
          body: "Датчик ең жоғары тарихи деңгейден жоғары тұруы керек. Мұз, қоқыс және конденсат ультрадыбыстық датчикке әсер етеді, сондықтан ашық ағында радар немесе гидростат сенімдірек.",
          bullets: [
            "деңгейді реперге немесе су өлшеуіш бағанға байлау",
            "мұз бен қоқыстан қорғалған бекітпе",
            "күн панеліне көлеңке түспейтін орын",
            "жергілікті биіктік белгісін GPS-пен тексеру",
          ],
        },
      ],
      sidebar: {
        title: "Станция жинағы",
        items: [
          "ультрадыбыстық немесе радарлық деңгей датчигі",
          "ESP32 контроллері немесе өнеркәсіптік RTU",
          "күн панелі, контроллер және АКБ",
          "LTE Cat-M1 / NB-IoT модемі",
          "IP67 корпус және найзағайдан қорғау",
          "мачта, кабель және бекітпе",
        ],
        note: "Пилоттық станция шамамен 100–250 мың ₸ тұрады. Өнеркәсіптік нұсқа — 400–800 мың ₸.",
      },
      steps: [
        { title: "Датчик", body: "суға дейінгі қашықтықты өлшейді" },
        { title: "Контроллер", body: "деңгейге айналдырып, шуылды сүзеді" },
        { title: "Байланыс", body: "MQTT арқылы телеметрия жібереді" },
        { title: "Платформа", body: "шекті тексеріп, қауіпті есептейді" },
      ],
    },
    prediction: {
      kicker: "Трендті болжау",
      title: "Су деңгейінен қауіп пен ерте ескертуге дейін",
      intro:
        "Модель тарихи деректер мен ағымдағы телеметрияны пайдаланып, деңгейдің көтерілу жылдамдығын, маусымдылықты және қауіпті шектен асу ықтималдығын бағалайды. Негізгі горизонт — 1–3 сағат.",
      stats: [
        { value: "1–3 сағ", label: "негізгі болжам" },
        { value: "48 сағ", label: "сирек, төмен сенімді болжам" },
        { value: "5 мин", label: "деректерді жаңарту" },
      ],
      sections: [
        {
          title: "Модель нені ескереді",
          body: "Болжам бір ғана саннан емес, станцияның тарихы мен ағымдағы жағдайының жиынтығынан шығады.",
          bullets: [
            "қазіргі деңгей және көтерілу жылдамдығы",
            "жауын-шашын мен ауа температурасы",
            "маусым, қар жамылғысы және топырақ ылғалы",
            "өткен паводоктар мен станция шектері",
            "датчик пен байланыс сенімділігі",
          ],
        },
        {
          title: "Нәтижеде не шығады",
          body: "Платформа болжамды шешімге айналдырады: қауіп деңгейі, түсіндірме және келесі әрекет.",
          bullets: [
            "болжамды су деңгейі, см",
            "қауіпті шектен асу ықтималдығы",
            "low / medium / high қауіп деңгейі",
            "операторға арналған қысқа түсіндірме",
          ],
        },
        {
          title: "Шектеулер",
          body: "Қазіргі модель бір аймаққа арналған және 1–3 сағаттық nowcast береді. 5–7 күндік болжам үшін жоғары ағыстағы бекеттер, жауын-шашын ансамбльдері және су қоймаларының деректері қажет.",
          bullets: [
            "модельді жергілікті паводоктармен калибрлеу керек",
            "R² жоғары болуы нақты дәлдікті білдірмейді",
            "картадағы аймақтық қауіп шектік ережеге сүйенеді",
          ],
        },
      ],
      sidebar: {
        title: "Қауіп сигналдары",
        items: [
          "warn және crit шектері",
          "көтерілу жылдамдығы, см/сағ",
          "жауын-шашын мөлшері",
          "станцияның online/offline күйі",
          "датчик қатесі және деректердің жаңалығы",
        ],
        note: "1–3 сағат — нақты уақыттағы nowcast. 48 сағат — тек бағдар, шешім қабылдау үшін оператор тексеруі керек.",
      },
      steps: [
        { title: "Деректер", body: "телеметрия және тарих жиналады" },
        { title: "Белгілер", body: "жылдамдық, жауын, маусым есептеледі" },
        { title: "Болжам", body: "деңгей мен қауіп ықтималдығы шығады" },
        { title: "Шешім", body: "оператор тревоганы бекітеді" },
      ],
    },
    alerts: {
      kicker: "Жедел ескертулер",
      title: "Тревога дежурныйға да, тұрғынға да жетеді",
      intro:
        "Шек асып кетсе, платформа pending-тревога жасайды. Оператор тексеріп, жариялайды — хабарлама Telegram-ға және ашық лентаға шығады.",
      stats: [
        { value: "30 сек", label: "тревоганы тексеру" },
        { value: "Telegram", label: "негізгі арна" },
        { value: "1 клик", label: "жариялау" },
      ],
      sections: [
        {
          title: "Тревога жолы",
          body: "Бұл қарапайым «смс жіберу» емес. Әр қадамда адам тексеретін нүкте бар, сондықтан жалған дабылдар азаяды.",
          bullets: [
            "телеметрия қабылданады",
            "шектік ереже қауіпті анықтайды",
            "pending-тревога оператор кезегіне түседі",
            "оператор тексереді және жариялайды",
            "хабарлама Telegram мен ашық лентаға кетеді",
          ],
        },
        {
          title: "Кімге барады",
          body: "Бір тревоганы әртүрлі топтар әртүрлі деңгейде көреді.",
          bullets: [
            "ДЧС кезекші операторына — толық карточка",
            "тұрғындарға — қысқа хабарлама және қауіп аймағы",
            "серіктестерге — API немесе журнал",
            "жүйеге — шешім журналы мен аудит",
          ],
        },
        {
          title: "Хабарламада не бар",
          body: "Адамға нақты әрекет керек, сондықтан хабарлама қысқа және нақты болады.",
          bullets: [
            "станция атауы және өзен",
            "ағымдағы деңгей және қауіпті шек",
            "қауіп деңгейі мен уақыты",
            "қысқа түсіндірме және ұсынылған әрекет",
          ],
        },
      ],
      sidebar: {
        title: "Хабарлау арналары",
        items: [
          "Telegram-бот және арна",
          "оператор панеліндегі тревога кезегі",
          "ашық тревога лентасы",
          "SMS/сирена интеграциясы",
          "серіктестер үшін webhook/API",
        ],
        note: "Демода Telegram арнасы негізгі. Өнеркәсіптік нұсқада SMS, сирена және жергілікті радио қосылады.",
      },
      steps: [
        { title: "Шек", body: "деңгей crit шегінен асады" },
        { title: "Тревога", body: "pending жазба жасалады" },
        { title: "Тексеру", body: "оператор деректерді растайды" },
        { title: "Жариялау", body: "Telegram және ашық лента" },
      ],
    },
  },
  ru: {
    iot: {
      kicker: "Сеть IoT-датчиков",
      title: "Автономные гидропосты на малых реках",
      intro:
        "Станция измеряет уровень воды каждые 1–5 минут, буферизует данные при потере связи и отправляет телеметрию по MQTT. Питание — солнечная панель, корпус — IP67.",
      stats: [
        { value: "1–5 мин", label: "интервал измерений" },
        { value: "24–72 ч", label: "буфер без связи" },
        { value: "IP67", label: "защита корпуса" },
      ],
      sections: [
        {
          title: "Что измеряет станция",
          body: "Главный канал — уровень воды. К нему добавляются служебные показатели, по которым видно, жива ли станция.",
          bullets: [
            "уровень воды и расстояние до датчика",
            "скорость подъёма, см/ч",
            "осадки и температура воздуха",
            "напряжение АКБ, солнечной панели и уровень сигнала",
            "код ошибки датчика и состояние связи",
          ],
        },
        {
          title: "Как передаются данные",
          body: "Контроллер фильтрует и усредняет показания, затем отправляет их по MQTT. Если связи нет, измерения остаются в локальном буфере и досылаются после восстановления.",
          bullets: [
            "MQTT или HTTPS, поддержка TLS",
            "статус online/offline через Last Will",
            "обычный режим — отправка раз в 5–15 минут",
            "режим паводка — раз в 1–2 минуты",
          ],
        },
        {
          title: "Где ставить",
          body: "Датчик должен быть выше максимального исторического уровня. Лёд, мусор и конденсат мешают ультразвуку, поэтому на открытом потоке надёжнее радар или гидростат.",
          bullets: [
            "привязка к реперу или водомерной рейке",
            "защита крепления от льда и плывущего мусора",
            "солнечная панель без затенения",
            "проверка локальной высоты по GPS",
          ],
        },
      ],
      sidebar: {
        title: "Комплект станции",
        items: [
          "ультразвуковой или радарный датчик уровня",
          "контроллер ESP32 или промышленный RTU",
          "солнечная панель, контроллер и АКБ",
          "модем LTE Cat-M1 / NB-IoT",
          "корпус IP67 и грозозащита",
          "мачта, кабели и крепёж",
        ],
        note: "Пилотная станция — примерно 100–250 тыс ₸. Промышленный комплект — 400–800 тыс ₸.",
      },
      steps: [
        { title: "Датчик", body: "измеряет расстояние до воды" },
        { title: "Контроллер", body: "пересчитывает в уровень и фильтрует шум" },
        { title: "Связь", body: "отправляет телеметрию по MQTT" },
        { title: "Платформа", body: "проверяет порог и считает риск" },
      ],
    },
    prediction: {
      kicker: "Прогнозирование тренда",
      title: "От уровня воды к риску и раннему предупреждению",
      intro:
        "Модель использует историю и текущую телеметрию: оценивает скорость подъёма, сезонность и вероятность превышения критической отметки. Основной горизонт — 1–3 часа.",
      stats: [
        { value: "1–3 ч", label: "основной nowcast" },
        { value: "48 ч", label: "редкий прогноз с низкой уверенностью" },
        { value: "5 мин", label: "обновление данных" },
      ],
      sections: [
        {
          title: "Что учитывает модель",
          body: "Прогноз строится не из одного числа, а из истории станции и текущей обстановки.",
          bullets: [
            "текущий уровень и скорость подъёма",
            "осадки и температура воздуха",
            "сезон, снежный покров и влажность почвы",
            "прошлые паводки и пороги станции",
            "надёжность датчика и связи",
          ],
        },
        {
          title: "Что выдаёт",
          body: "Платформа превращает прогноз в решение: уровень риска, объяснение и следующее действие.",
          bullets: [
            "прогнозный уровень воды, см",
            "вероятность превышения критического порога",
            "риск low / medium / high",
            "короткое объяснение для оператора",
          ],
        },
        {
          title: "Границы применимости",
          body: "Сейчас модель одна на регион и даёт nowcast на 1–3 часа. Для прогноза на 5–7 дней нужны верхние гидропосты, ансамбли осадков и данные водохранилищ.",
          bullets: [
            "модель нужно калибровать на местных паводках",
            "высокий R² не равен реальной точности",
            "риск на карте районов — пороговое правило, не ML",
          ],
        },
      ],
      sidebar: {
        title: "Сигналы риска",
        items: [
          "пороги warn и crit",
          "скорость подъёма, см/ч",
          "количество осадков",
          "статус станции online/offline",
          "ошибка датчика и свежесть данных",
        ],
        note: "1–3 часа — оперативный nowcast. 48 часов — только ориентир, решение принимает оператор после проверки.",
      },
      steps: [
        { title: "Данные", body: "телеметрия и история" },
        { title: "Признаки", body: "скорость, дождь, сезон" },
        { title: "Прогноз", body: "уровень и вероятность риска" },
        { title: "Решение", body: "оператор подтверждает тревогу" },
      ],
    },
    alerts: {
      kicker: "Мгновенные оповещения",
      title: "Тревога доходит до дежурного и до жителя",
      intro:
        "Порог превышен — платформа создаёт pending-тревогу. Оператор проверяет, публикует, и сообщение уходит в Telegram и публичную ленту.",
      stats: [
        { value: "30 сек", label: "проверка тревоги" },
        { value: "Telegram", label: "основной канал" },
        { value: "1 клик", label: "публикация" },
      ],
      sections: [
        {
          title: "Путь тревоги",
          body: "Это не просто «отправить SMS». На каждом шаге есть точка проверки человеком, поэтому ложных срабатываний меньше.",
          bullets: [
            "телеметрия принимается",
            "пороговое правило определяет риск",
            "pending-тревога попадает в очередь оператора",
            "оператор проверяет и публикует",
            "сообщение уходит в Telegram и публичную ленту",
          ],
        },
        {
          title: "Кому уходит",
          body: "Одна тревога видна разным группам с разным уровнем детализации.",
          bullets: [
            "дежурному ДЧС — полная карточка",
            "жителям — короткое сообщение и зона риска",
            "партнёрам — API или журнал",
            "системе — журнал решений и аудит",
          ],
        },
        {
          title: "Что в сообщении",
          body: "Человеку нужно конкретное действие, поэтому сообщение короткое и точное.",
          bullets: [
            "название станции и река",
            "текущий уровень и критический порог",
            "уровень риска и время",
            "краткое объяснение и рекомендация",
          ],
        },
      ],
      sidebar: {
        title: "Каналы оповещения",
        items: [
          "Telegram-бот и канал",
          "очередь тревог в панели оператора",
          "публичная лента тревог",
          "интеграция SMS/сирена",
          "webhook/API для партнёров",
        ],
        note: "В демо основной канал — Telegram. В промышленной версии добавляются SMS, сирены и локальное радио.",
      },
      steps: [
        { title: "Порог", body: "уровень выше crit" },
        { title: "Тревога", body: "создаётся pending-запись" },
        { title: "Проверка", body: "оператор подтверждает данные" },
        { title: "Публикация", body: "Telegram и публичная лента" },
      ],
    },
  },
  en: {
    iot: {
      kicker: "IoT sensor network",
      title: "Autonomous gauges on small rivers",
      intro:
        "The station measures water level every 1–5 minutes, buffers data when connectivity drops, and sends telemetry over MQTT. Solar power and an IP67 enclosure keep it running in the field.",
      stats: [
        { value: "1–5 min", label: "measurement interval" },
        { value: "24–72 h", label: "offline buffer" },
        { value: "IP67", label: "enclosure protection" },
      ],
      sections: [
        {
          title: "What the station measures",
          body: "Water level is the primary channel. Health metrics show whether the station is still alive and trustworthy.",
          bullets: [
            "water level and sensor distance",
            "rate of rise, cm/h",
            "rainfall and air temperature",
            "battery, solar and signal voltage",
            "sensor error code and link state",
          ],
        },
        {
          title: "How data gets there",
          body: "The controller filters and averages readings, then publishes them over MQTT. If the link is down, measurements stay in a local buffer and are replayed on reconnect.",
          bullets: [
            "MQTT or HTTPS with TLS support",
            "online/offline state via Last Will",
            "normal mode: publish every 5–15 minutes",
            "flood mode: publish every 1–2 minutes",
          ],
        },
        {
          title: "Where to install it",
          body: "Mount the sensor above the historic maximum level. Ice, debris and condensation affect ultrasonic sensors, so a radar or pressure sensor is safer on an open stream.",
          bullets: [
            "tie the datum to a benchmark or staff gauge",
            "protect the mount from ice and floating debris",
            "keep the solar panel unshaded",
            "verify local elevation with GPS",
          ],
        },
      ],
      sidebar: {
        title: "Station kit",
        items: [
          "ultrasonic or radar level sensor",
          "ESP32 controller or industrial RTU",
          "solar panel, controller and battery",
          "LTE Cat-M1 / NB-IoT modem",
          "IP67 enclosure and surge protection",
          "mast, cables and mounting hardware",
        ],
        note: "A pilot station costs about KZT 100–250k. An industrial kit costs KZT 400–800k.",
      },
      steps: [
        { title: "Sensor", body: "measures distance to water" },
        { title: "Controller", body: "converts to level and filters noise" },
        { title: "Link", body: "publishes telemetry over MQTT" },
        { title: "Platform", body: "checks thresholds and scores risk" },
      ],
    },
    prediction: {
      kicker: "Trend prediction",
      title: "From water level to risk and early warning",
      intro:
        "The model uses history and live telemetry to estimate rate of rise, seasonality and the chance of crossing the critical mark. The main horizon is 1–3 hours.",
      stats: [
        { value: "1–3 h", label: "primary nowcast" },
        { value: "48 h", label: "low-confidence outlook" },
        { value: "5 min", label: "data refresh" },
      ],
      sections: [
        {
          title: "What the model uses",
          body: "A forecast is more than one number: it combines station history with the current situation.",
          bullets: [
            "current level and rate of rise",
            "rainfall and air temperature",
            "season, snow cover and soil moisture",
            "past floods and station thresholds",
            "sensor and connectivity reliability",
          ],
        },
        {
          title: "What it produces",
          body: "The platform turns a forecast into a decision: risk level, explanation and next action.",
          bullets: [
            "forecast water level, cm",
            "probability of crossing the critical threshold",
            "low / medium / high risk",
            "short operator-facing explanation",
          ],
        },
        {
          title: "Limits",
          body: "The current model is regional and produces a 1–3 hour nowcast. A 5–7 day forecast needs upstream gauges, rainfall ensembles and reservoir data.",
          bullets: [
            "calibrate against local flood events",
            "a high R² is not real-world accuracy",
            "district risk on the map is threshold-based, not ML",
          ],
        },
      ],
      sidebar: {
        title: "Risk signals",
        items: [
          "warn and crit thresholds",
          "rate of rise, cm/h",
          "rainfall amount",
          "station online/offline state",
          "sensor error and data freshness",
        ],
        note: "1–3 hours is an operational nowcast. 48 hours is an outlook only; an operator must verify it.",
      },
      steps: [
        { title: "Data", body: "telemetry and history" },
        { title: "Features", body: "rate, rain, season" },
        { title: "Forecast", body: "level and risk probability" },
        { title: "Decision", body: "operator confirms the alert" },
      ],
    },
    alerts: {
      kicker: "Instant alerts",
      title: "The warning reaches the duty officer and the resident",
      intro:
        "When a threshold is crossed, the platform creates a pending alert. An operator reviews and publishes it, and the message goes to Telegram and the public feed.",
      stats: [
        { value: "30 sec", label: "alert review" },
        { value: "Telegram", label: "primary channel" },
        { value: "1 click", label: "to publish" },
      ],
      sections: [
        {
          title: "Alert path",
          body: "This is not just “send an SMS”. Every step has a human checkpoint, which reduces false alarms.",
          bullets: [
            "telemetry is ingested",
            "a threshold rule detects risk",
            "a pending alert enters the operator queue",
            "the operator reviews and publishes",
            "the message goes to Telegram and the public feed",
          ],
        },
        {
          title: "Who receives it",
          body: "One alert is shown to different groups at different levels of detail.",
          bullets: [
            "duty officer — full alert card",
            "residents — short message and risk zone",
            "partners — API or log access",
            "the system — decision log and audit trail",
          ],
        },
        {
          title: "What the message contains",
          body: "People need a concrete action, so the message stays short and specific.",
          bullets: [
            "station name and river",
            "current level and critical threshold",
            "risk level and timestamp",
            "short explanation and recommendation",
          ],
        },
      ],
      sidebar: {
        title: "Alert channels",
        items: [
          "Telegram bot and channel",
          "operator alert queue",
          "public alert feed",
          "SMS/siren integration",
          "webhook/API for partners",
        ],
        note: "Telegram is the primary demo channel. A production deployment adds SMS, sirens and local radio.",
      },
      steps: [
        { title: "Threshold", body: "level crosses crit" },
        { title: "Alert", body: "a pending record is created" },
        { title: "Review", body: "operator verifies the data" },
        { title: "Publish", body: "Telegram and public feed" },
      ],
    },
  },
};
