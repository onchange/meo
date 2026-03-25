const DUMMY_DATA = {
  prefectures: {
    "27": "大阪府",
    "13": "東京都",
    "23": "愛知県",
  },
  municipalities: {
    "27": {
      "27128": "中央区",
      "27127": "北区",
      "27102": "都島区",
    },
    "13": {
      "13101": "千代田区",
      "13102": "中央区",
      "13103": "港区",
    },
    "23": {
      "23101": "千種区",
      "23102": "東区",
      "23106": "中区",
    },
  },
  industries: [
    { code: "8311", name: "歯科診療所" },
    { code: "831", name: "一般診療所（内科等）" },
    { code: "7811", name: "美容業（美容院）" },
    { code: "7812", name: "理容業" },
    { code: "76", name: "飲食店" },
    { code: "8351", name: "整骨院・鍼灸院" },
    { code: "8231", name: "学習塾" },
    { code: "693", name: "不動産仲介" },
  ],
  results: {
    "27128_8311": {
      municipalityName: "大阪市中央区",
      prefectureName: "大阪府",
      industryName: "歯科診療所",
      count: 142,
      prefectureAvg: 44,
      nationalAvg: 30,
      prefectureRatio: 3.2,
      nationalRatio: 4.8,
      population: 107335,
      perCapita: 13.2,
      perCapitaNationalAvg: 5.3,
      daytimeRatio: 8.23,
      ageUnder15: 8,
      age15to64: 72,
      age65over: 20,
      score: 82,
      mapCenter: [34.6814, 135.5014],
      mapZoom: 15,
      competitors: [
        { lat: 34.6821, lng: 135.5023, name: "A歯科クリニック" },
        { lat: 34.6798, lng: 135.4987, name: "B歯科医院" },
        { lat: 34.6835, lng: 135.5045, name: "Cデンタルオフィス" },
        { lat: 34.6790, lng: 135.5060, name: "D歯科" },
        { lat: 34.6850, lng: 135.4995, name: "E歯科クリニック" },
        { lat: 34.6775, lng: 135.5030, name: "Fデンタル" },
        { lat: 34.6810, lng: 135.4960, name: "G歯科医院" },
        { lat: 34.6840, lng: 135.5070, name: "H歯科" },
        { lat: 34.6765, lng: 135.5010, name: "I歯科クリニック" },
        { lat: 34.6830, lng: 135.4940, name: "J歯科医院" },
        { lat: 34.6805, lng: 135.5080, name: "Kデンタル" },
        { lat: 34.6855, lng: 135.5015, name: "L歯科" },
      ],
    },
  },
};

const DEFAULT_RESULT_KEY = "27128_8311";

const prefectureEl = document.getElementById("prefecture");
const municipalityEl = document.getElementById("municipality");
const industryEl = document.getElementById("industry");
const diagnoseBtn = document.getElementById("diagnose-btn");
const reportEl = document.getElementById("report");

let densityChartInstance = null;
let ageChartInstance = null;
let mapInstance = null;

function init() {
  populatePrefectures();
  populateIndustries();

  prefectureEl.addEventListener("change", onPrefectureChange);
  municipalityEl.addEventListener("change", updateDiagnoseBtn);
  industryEl.addEventListener("change", updateDiagnoseBtn);
  diagnoseBtn.addEventListener("click", showReport);
  document.getElementById("copy-btn").addEventListener("click", copyTalkText);
}

function populatePrefectures() {
  for (const [code, name] of Object.entries(DUMMY_DATA.prefectures)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    prefectureEl.appendChild(opt);
  }
}

function populateIndustries() {
  for (const ind of DUMMY_DATA.industries) {
    const opt = document.createElement("option");
    opt.value = ind.code;
    opt.textContent = ind.name;
    industryEl.appendChild(opt);
  }
}

function onPrefectureChange() {
  const prefCode = prefectureEl.value;
  municipalityEl.innerHTML = "";

  if (!prefCode) {
    municipalityEl.disabled = true;
    municipalityEl.innerHTML = '<option value="">先に都道府県を選択</option>';
    updateDiagnoseBtn();
    return;
  }

  municipalityEl.disabled = false;
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "選択してください";
  municipalityEl.appendChild(defaultOpt);

  const munis = DUMMY_DATA.municipalities[prefCode] || {};
  for (const [code, name] of Object.entries(munis)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    municipalityEl.appendChild(opt);
  }
  updateDiagnoseBtn();
}

function updateDiagnoseBtn() {
  diagnoseBtn.disabled = !(prefectureEl.value && municipalityEl.value && industryEl.value);
}

function showReport() {
  const key = `${municipalityEl.value}_${industryEl.value}`;
  const data = DUMMY_DATA.results[key] || DUMMY_DATA.results[DEFAULT_RESULT_KEY];

  document.getElementById("score-value").textContent = data.score;

  const scoreColor = data.score >= 80 ? "var(--green)" : data.score >= 60 ? "var(--yellow)" : "var(--red)";
  document.getElementById("score-value").style.color = scoreColor;

  const scoreLabel = data.score >= 80 ? "MEO効果: 大" : data.score >= 60 ? "MEO効果: 中" : "MEO効果: 小";
  document.getElementById("score-label").textContent = scoreLabel;
  document.getElementById("score-label").style.color = scoreColor;

  document.getElementById("score-comment").textContent =
    "競合密度が高く、昼間人口も豊富。MEO対策で差別化する効果が大きいエリアです。";

  drawGauge(document.getElementById("gauge-svg"), data.score);

  document.getElementById("density-headline").innerHTML =
    `${data.municipalityName}の${data.industryName}は <strong>${data.count}件</strong>（府平均の${data.prefectureRatio}倍 / 全国平均の${data.nationalRatio}倍）`;

  if (densityChartInstance) densityChartInstance.destroy();
  densityChartInstance = renderDensityChart("density-chart", {
    labels: [data.municipalityName, `${data.prefectureName}平均`, "全国平均"],
    values: [data.count, data.prefectureAvg, data.nationalAvg],
  });

  document.getElementById("per-capita-value").textContent =
    `人口1万人あたり ${data.perCapita}件`;
  document.getElementById("per-capita-avg").textContent =
    `全国平均: ${data.perCapitaNationalAvg}件`;

  document.getElementById("pop-total").textContent =
    data.population.toLocaleString() + "人";
  document.getElementById("pop-daytime").textContent =
    data.daytimeRatio + "倍";

  if (ageChartInstance) ageChartInstance.destroy();
  ageChartInstance = renderAgeChart("age-chart", {
    labels: ["15歳未満", "15〜64歳", "65歳以上"],
    values: [data.ageUnder15, data.age15to64, data.age65over],
  });

  renderCompetitorMap(data);

  document.getElementById("talk-text").textContent =
    `${data.municipalityName}は${data.industryName}の競合が全国平均の${data.nationalRatio}倍。Googleマップで検索される患者さんに見つけてもらうには、上位3位以内の表示が不可欠です。`;

  reportEl.hidden = false;
  reportEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCompetitorMap(data) {
  document.getElementById("map-summary").innerHTML =
    `<strong>${data.competitors.length}件</strong>の${data.industryName}が${data.municipalityName}周辺にひしめいています`;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  mapInstance = L.map("competitor-map", {
    center: data.mapCenter,
    zoom: data.mapZoom,
    scrollWheelZoom: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  const pinIcon = L.divIcon({
    className: "competitor-pin",
    html: '<div class="pin-dot"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  for (const c of data.competitors) {
    L.marker([c.lat, c.lng], { icon: pinIcon })
      .addTo(mapInstance)
      .bindPopup(`<strong>${c.name}</strong>`);
  }

  setTimeout(() => mapInstance.invalidateSize(), 100);
}

function copyTalkText() {
  const text = document.getElementById("talk-text").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "コピー済み";
    setTimeout(() => {
      btn.textContent = "コピー";
    }, 2000);
  });
}

document.addEventListener("DOMContentLoaded", init);
