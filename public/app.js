const INDUSTRY_LABELS = {
  "833": "歯科診療所",
  "832": "一般診療所（内科等）",
  "783": "美容業（美容院）",
  "782": "理容業",
  "76": "飲食店",
  "835": "療術業（整骨院・鍼灸院等）",
  "823": "学習塾",
  "682": "不動産代理業・仲介業",
};

const PREF_ORDER = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25","26","27","28","29","30",
  "31","32","33","34","35","36","37","38","39","40",
  "41","42","43","44","45","46","47",
];

let dataStore = {
  municipalities: null,
  businesses: null,
  population: null,
  averages: null,
};

let densityChartInstance = null;
let ageChartInstance = null;

const prefectureEl = document.getElementById("prefecture");
const municipalityEl = document.getElementById("municipality");
const industryEl = document.getElementById("industry");
const diagnoseBtn = document.getElementById("diagnose-btn");
const reportEl = document.getElementById("report");
const loadingEl = document.getElementById("loading");
const formSection = document.getElementById("form-section");

async function loadData() {
  const base = "./data";
  const [municipalities, businesses, population, averages] = await Promise.all([
    fetch(`${base}/municipalities.json`).then((r) => r.json()),
    fetch(`${base}/census_businesses.json`).then((r) => r.json()),
    fetch(`${base}/census_population.json`).then((r) => r.json()),
    fetch(`${base}/averages.json`).then((r) => r.json()),
  ]);
  dataStore = { municipalities, businesses, population, averages };
}

function buildPrefectureIndex() {
  const prefMap = {};
  for (const [code, muni] of Object.entries(dataStore.municipalities)) {
    const pc = muni.prefCode;
    if (!prefMap[pc]) {
      prefMap[pc] = { name: muni.prefName, municipalities: [] };
    }
    prefMap[pc].municipalities.push({ code, name: muni.name });
  }
  for (const pref of Object.values(prefMap)) {
    pref.municipalities.sort((a, b) => a.code.localeCompare(b.code));
  }
  return prefMap;
}

function populatePrefectures(prefMap) {
  for (const pc of PREF_ORDER) {
    const pref = prefMap[pc];
    if (!pref) continue;
    const opt = document.createElement("option");
    opt.value = pc;
    opt.textContent = pref.name;
    prefectureEl.appendChild(opt);
  }
}

function populateIndustries() {
  for (const [code, name] of Object.entries(INDUSTRY_LABELS)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    industryEl.appendChild(opt);
  }
}

function onPrefectureChange(prefMap) {
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

  const pref = prefMap[prefCode];
  if (pref) {
    for (const m of pref.municipalities) {
      const opt = document.createElement("option");
      opt.value = m.code;
      opt.textContent = m.name;
      municipalityEl.appendChild(opt);
    }
  }
  updateDiagnoseBtn();
}

function updateDiagnoseBtn() {
  diagnoseBtn.disabled = !(prefectureEl.value && municipalityEl.value && industryEl.value);
}

function showReport() {
  const muniCode = municipalityEl.value;
  const industryCode = industryEl.value;
  const prefCode = prefectureEl.value;

  const muni = dataStore.municipalities[muniCode];
  const biz = dataStore.businesses[muniCode] || {};
  const pop = dataStore.population[muniCode];
  const natAvg = dataStore.averages.national[industryCode];
  const prefAvg = (dataStore.averages.prefecture[prefCode] || {})[industryCode];

  if (!muni || !pop || !natAvg) {
    alert("データが見つかりません");
    return;
  }

  const count = biz[industryCode] || 0;
  const industryName = INDUSTRY_LABELS[industryCode];
  const muniName = `${muni.prefName}${muni.name}`;

  const perCapita = pop.total > 0
    ? Math.round((count / pop.total) * 10000 * 100) / 100
    : 0;

  const prefAvgCount = prefAvg ? Math.round(prefAvg.perCapita / 10000 * pop.total) : 0;
  const natAvgCount = Math.round(natAvg.perCapita / 10000 * pop.total);
  const prefRatio = prefAvg && prefAvg.perCapita > 0
    ? Math.round((perCapita / prefAvg.perCapita) * 10) / 10
    : 0;
  const natRatio = natAvg.perCapita > 0
    ? Math.round((perCapita / natAvg.perCapita) * 10) / 10
    : 0;

  const compScore = calculateCompetitionScore(perCapita, natAvg.perCapita);
  const popScore = calculatePopulationScore(pop.total);
  const dayScore = calculateDaytimeScore(pop.daytimeRatio);
  const totalScore = calculateTotalScore(compScore, popScore, dayScore);

  const scoreColor = totalScore >= 80 ? "var(--green)" : totalScore >= 60 ? "var(--yellow)" : "var(--muted)";

  document.getElementById("score-value").textContent = totalScore;
  document.getElementById("score-value").style.color = scoreColor;
  document.getElementById("score-label").textContent = getScoreLabel(totalScore);
  document.getElementById("score-label").style.color = scoreColor;
  document.getElementById("score-comment").textContent = getScoreComment(totalScore);

  drawGauge(document.getElementById("gauge-svg"), totalScore);

  const prefLabel = prefAvg ? `${muni.prefName}平均の${prefRatio}倍 / ` : "";
  document.getElementById("density-headline").innerHTML =
    `${muniName}の${industryName}は <strong>${count}件</strong>（${prefLabel}全国平均の${natRatio}倍）`;

  if (densityChartInstance) densityChartInstance.destroy();
  const densityLabels = [muniName];
  const densityValues = [count];
  if (prefAvg) {
    densityLabels.push(`${muni.prefName}平均`);
    densityValues.push(Math.round(prefAvg.perCapita / 10000 * pop.total));
  }
  densityLabels.push("全国平均");
  densityValues.push(natAvgCount);
  densityChartInstance = renderDensityChart("density-chart", {
    labels: densityLabels,
    values: densityValues,
  });

  document.getElementById("per-capita-value").textContent =
    `人口1万人あたり ${perCapita}件`;
  document.getElementById("per-capita-avg").textContent =
    `全国平均: ${natAvg.perCapita}件`;

  document.getElementById("pop-total").textContent =
    pop.total.toLocaleString() + "人";
  document.getElementById("pop-daytime").textContent =
    pop.daytimeRatio + "倍";

  if (ageChartInstance) ageChartInstance.destroy();
  ageChartInstance = renderAgeChart("age-chart", {
    labels: ["15歳未満", "15〜64歳", "65歳以上"],
    values: [
      Math.round(pop.under15 * 10) / 10,
      Math.round(pop.age15to64 * 10) / 10,
      Math.round(pop.over65 * 10) / 10,
    ],
  });

  if (muni.lat && muni.lng) {
    renderAreaMap(muni.lat, muni.lng, muniName, industryCode, industryName, count);
    document.querySelector(".card--map").hidden = false;
  } else {
    document.querySelector(".card--map").hidden = true;
  }

  document.getElementById("talk-text").textContent =
    `${muniName}は${industryName}の競合が全国平均の${natRatio}倍。Googleマップで検索されるお客様に見つけてもらうには、上位3位以内の表示が不可欠です。`;

  reportEl.hidden = false;
  reportEl.scrollIntoView({ behavior: "smooth", block: "start" });
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

async function init() {
  try {
    await loadData();
  } catch (e) {
    loadingEl.textContent = "データの読み込みに失敗しました。";
    console.error(e);
    return;
  }

  const prefMap = buildPrefectureIndex();
  populatePrefectures(prefMap);
  populateIndustries();

  prefectureEl.addEventListener("change", () => onPrefectureChange(prefMap));
  municipalityEl.addEventListener("change", updateDiagnoseBtn);
  industryEl.addEventListener("change", updateDiagnoseBtn);
  diagnoseBtn.addEventListener("click", showReport);
  document.getElementById("copy-btn").addEventListener("click", copyTalkText);

  loadingEl.hidden = true;
  formSection.hidden = false;
}

document.addEventListener("DOMContentLoaded", init);
