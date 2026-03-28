let mapInstance = null;

const INDUSTRY_OSM_TAGS = {
  "833": [{ key: "amenity", value: "dentist" }],
  "832": [{ key: "amenity", value: "clinic" }, { key: "amenity", value: "doctors" }],
  "783": [{ key: "shop", value: "hairdresser" }],
  "782": [{ key: "shop", value: "barber" }],
  "76": [
    { key: "amenity", value: "restaurant" },
    { key: "amenity", value: "cafe" },
    { key: "amenity", value: "fast_food" },
  ],
  "835": [
    { key: "amenity", value: "clinic" },
    { key: "healthcare", value: "alternative" },
  ],
  "823": [
    { key: "amenity", value: "school" },
    { key: "office", value: "educational_institution" },
  ],
  "682": [{ key: "office", value: "estate_agent" }],
};

async function fetchOverpassPOIs(lat, lng, industryCode) {
  const osmTags = INDUSTRY_OSM_TAGS[industryCode];
  if (!osmTags) return [];

  const radius = 5000;
  const tagFilters = osmTags
    .map(({ key, value }) => `nwr["${key}"="${value}"](around:${radius},${lat},${lng});`)
    .join("\n");
  const query = `[out:json][timeout:15];\n(\n${tagFilters}\n);\nout center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.elements
    .map((el) => {
      if (el.type === "node") return [el.lat, el.lon];
      if (el.center) return [el.center.lat, el.center.lon];
      return null;
    })
    .filter(Boolean);
}

function generatePinPositions(lat, lng, count, seed) {
  const maxPins = Math.min(count, 80);
  const positions = [];
  const spread = 0.015;
  let s = seed;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  }
  for (let i = 0; i < maxPins; i++) {
    const angle = rand() * 2 * Math.PI;
    const r = Math.sqrt(rand()) * spread;
    positions.push([lat + r * Math.sin(angle), lng + r * Math.cos(angle)]);
  }
  return positions;
}

async function renderAreaMap(lat, lng, municipalityName, industryCode, industryName, count) {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  document.getElementById("map-summary").innerHTML =
    `<strong>${count}件</strong>の${industryName}が${municipalityName}にあります（データ取得中...）`;

  mapInstance = L.map("area-map", {
    center: [lat, lng],
    zoom: 14,
    scrollWheelZoom: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  const pinIcon = L.divIcon({
    className: "competitor-pin",
    html: '<div class="pin-dot"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const centerIcon = L.divIcon({
    className: "center-pin",
    html: '<div class="center-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  L.marker([lat, lng], { icon: centerIcon })
    .addTo(mapInstance)
    .bindPopup(`<strong>${municipalityName}</strong><br>${industryName}: ${count}件`)
    .openPopup();

  setTimeout(() => mapInstance.invalidateSize(), 100);

  let positions = [];
  let sourceLabel = "";

  try {
    const osmPositions = await fetchOverpassPOIs(lat, lng, industryCode);
    if (osmPositions.length >= 3) {
      positions = osmPositions;
      sourceLabel = `（OpenStreetMap上に${osmPositions.length}件を表示）`;
    } else {
      throw new Error("OSMデータ不足");
    }
  } catch {
    const seed = Math.abs(Math.round(lat * 1000) * 31 + Math.round(lng * 1000));
    const shown = Math.min(count, 80);
    positions = generatePinPositions(lat, lng, count, seed);
    sourceLabel = count > 80
      ? `（統計データに基づく散布表示・${shown}件）`
      : `（統計データに基づく散布表示）`;
  }

  for (const pos of positions) {
    L.marker(pos, { icon: pinIcon }).addTo(mapInstance);
  }

  document.getElementById("map-summary").innerHTML =
    `<strong>${count}件</strong>の${industryName}が${municipalityName}にあります${sourceLabel}`;
}
