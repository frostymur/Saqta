// Geographic reference data used by the adaptive dashboard.
// Region names must match the strings seeded by the backend
// ("Петропавловск (СКО)", "Астана", ...).

const SKO_DISTRICTS = [
  {
    id: "zarechny",
    name: "Заречный",
    nameEn: "Zarechny",
    lat: 54.9023,
    lng: 69.1191,
    status: "danger",
    statusRu: "Опасность подтопления — эвакуация",
    statusEn: "Flood danger — evacuate",
  },
  {
    id: "kozhzavod",
    name: "Кожзавод",
    nameEn: "Kozhzavod",
    lat: 54.8842,
    lng: 69.0730,
    status: "danger",
    statusRu: "Опасность подтопления",
    statusEn: "Flood danger",
  },
  {
    id: "center",
    name: "Центр города",
    nameEn: "City Center",
    lat: 54.8753,
    lng: 69.1410,
    status: "safe",
    statusRu: "Безопасно",
    statusEn: "Safe",
  },
  {
    id: "microdistrict20",
    name: "20-й микрорайон",
    nameEn: "Microdistrict 20",
    lat: 54.9094,
    lng: 69.1339,
    status: "safe",
    statusRu: "Безопасно",
    statusEn: "Safe",
  },
];

export const DASHBOARD_REGIONS = [
  {
    id: "sko",
    name: "Петропавловск (СКО)",
    shortName: "Петропавловск",
    center: [69.1389, 54.8753],
    zoom: 11.8,
    river: "Есиль / Ишим",
    districts: SKO_DISTRICTS,
  },
  {
    id: "astana",
    name: "Астана",
    shortName: "Астана",
    center: [71.428, 51.16],
    zoom: 11,
    river: "Есиль / Ишим",
    districts: [
      { id: "astana-left", name: "Левый берег", nameEn: "Left Bank", lat: 51.152, lng: 71.42, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "astana-esil", name: "Набережная Есиль", nameEn: "Esil Embankment", lat: 51.166, lng: 71.436, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "astana-ilinka", name: "Ильинка", nameEn: "Ilyinka", lat: 51.127, lng: 71.39, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
    ],
  },
  {
    id: "zko",
    name: "Уральск (ЗКО)",
    shortName: "Уральск",
    center: [51.372, 51.215],
    zoom: 11,
    river: "Жайык / Урал",
    districts: [
      { id: "uralsk-zachagansk", name: "Зачаганск", nameEn: "Zachagansk", lat: 51.19, lng: 51.35, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "uralsk-podstepnoe", name: "Подстепное", nameEn: "Podstepnoye", lat: 51.17, lng: 51.45, status: "danger", statusRu: "Риск подтопления", statusEn: "Flood risk" },
      { id: "uralsk-dachi", name: "Дачные массивы", nameEn: "Dacha areas", lat: 51.23, lng: 51.32, status: "danger", statusRu: "Опасность подтопления", statusEn: "Flood danger" },
    ],
  },
  {
    id: "atyrau",
    name: "Атырау",
    shortName: "Атырау",
    center: [51.883, 47.116],
    zoom: 11,
    river: "Жайык / Урал",
    districts: [
      { id: "atyrau-center", name: "Центр Атырау", nameEn: "Atyrau Center", lat: 47.116, lng: 51.883, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "atyrau-balykshi", name: "Балыкши", nameEn: "Balykshi", lat: 47.075, lng: 51.86, status: "safe", statusRu: "Защищено дамбой", statusEn: "Protected by levee" },
      { id: "atyrau-inder", name: "Индербор", nameEn: "Inderbor", lat: 47.24, lng: 51.72, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
    ],
  },
  {
    id: "kostanay",
    name: "Костанай",
    shortName: "Костанай",
    center: [63.632, 53.214],
    zoom: 11,
    river: "Тобол",
    districts: [
      { id: "kostanay-center", name: "Центр Костаная", nameEn: "Kostanay Center", lat: 53.214, lng: 63.632, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "kostanay-kolesnie", name: "Колесные ряды", nameEn: "Kolesnye Ryady", lat: 53.21, lng: 63.61, status: "danger", statusRu: "Мониторинг прибрежной зоны", statusEn: "Riverside watch" },
      { id: "kostanay-tobol", name: "Пойма Тобола", nameEn: "Tobol floodplain", lat: 53.18, lng: 63.66, status: "danger", statusRu: "Риск подтопления", statusEn: "Flood risk" },
    ],
  },
  {
    id: "aktobe",
    name: "Актобе",
    shortName: "Актобе",
    center: [57.267, 50.217],
    zoom: 11,
    river: "Илек / Каргала",
    districts: [
      { id: "aktobe-center", name: "Центр Актобе", nameEn: "Aktobe Center", lat: 50.217, lng: 57.267, status: "safe", statusRu: "Безопасно", statusEn: "Safe" },
      { id: "aktobe-kirpichniy", name: "Кирпичный", nameEn: "Kirpichny", lat: 50.24, lng: 57.22, status: "safe", statusRu: "Вода отступила", statusEn: "Water receded" },
      { id: "aktobe-ilek", name: "Пойма Илека", nameEn: "Ilek floodplain", lat: 50.26, lng: 57.33, status: "danger", statusRu: "Риск подтопления", statusEn: "Flood risk" },
    ],
  },
];

export const DEFAULT_REGION_ID = "sko";

export function getRegionById(id) {
  return DASHBOARD_REGIONS.find((r) => r.id === id) || DASHBOARD_REGIONS[0];
}

export function getRegionByName(name) {
  return (
    DASHBOARD_REGIONS.find((r) => r.name === name || r.shortName === name) ||
    null
  );
}

export function findDistrict(regionId, districtId) {
  const region = getRegionById(regionId);
  return region?.districts.find((d) => d.id === districtId) || null;
}

export function allDistricts() {
  return DASHBOARD_REGIONS.flatMap((region) =>
    region.districts.map((district) => ({
      ...district,
      regionId: region.id,
      regionName: region.name,
    }))
  );
}
