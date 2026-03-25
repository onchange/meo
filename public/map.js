let mapInstance = null;

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

function renderAreaMap(lat, lng, municipalityName, industryName, count) {
  const remaining = count > 80 ? count - 80 : 0;
  const shown = Math.min(count, 80);
  let summary = `<strong>${count}件</strong>の${industryName}が${municipalityName}にあります`;
  if (remaining > 0) {
    summary += `（地図上には${shown}件を表示）`;
  }
  document.getElementById("map-summary").innerHTML = summary;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

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

  const seed = Math.abs(Math.round(lat * 1000) * 31 + Math.round(lng * 1000));
  const positions = generatePinPositions(lat, lng, count, seed);

  for (const pos of positions) {
    L.marker(pos, { icon: pinIcon }).addTo(mapInstance);
  }

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
}
