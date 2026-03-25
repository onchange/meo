import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { EStatClient } from "./e-stat-client.js";
import { STAT_IDS } from "./stat-ids.js";
import type { EStatValue, PopulationData } from "./types.js";

function isMunicipalityCode(area: string): boolean {
  return area !== "00000" && !area.endsWith("000");
}

function parseNumber(raw: string | null): number {
  if (raw === null || raw === "-" || raw === "x" || raw === "…" || raw === "***") return 0;
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

export function parsePopulationTotal(values: EStatValue[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const v of values) {
    const area = v["@area"];
    if (!area || !isMunicipalityCode(area)) continue;
    if (v["@cat01"] !== "0") continue;

    result[area] = parseNumber(v.$);
  }

  return result;
}

export function parseAgeRatios(
  values: EStatValue[],
): Record<string, { under15: number; age15to64: number; over65: number }> {
  const result: Record<string, { under15: number; age15to64: number; over65: number }> = {};

  for (const v of values) {
    const area = v["@area"];
    if (!area || !isMunicipalityCode(area)) continue;
    if (v["@cat01"] !== "0") continue;
    if (v["@cat02"] !== "0") continue;

    const cat03 = v["@cat03"];
    if (!cat03 || !["1", "2", "3"].includes(cat03)) continue;

    if (!result[area]) result[area] = { under15: 0, age15to64: 0, over65: 0 };

    const val = parseNumber(v.$);
    if (cat03 === "1") result[area].under15 = val;
    else if (cat03 === "2") result[area].age15to64 = val;
    else if (cat03 === "3") result[area].over65 = val;
  }

  return result;
}

export function parseDaytimeRatio(values: EStatValue[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const v of values) {
    const area = v["@area"];
    if (!area || !isMunicipalityCode(area)) continue;
    if (v["@cat01"] !== "0") continue;
    if (v["@cat02"] !== "00") continue;

    const raw = parseNumber(v.$);
    result[area] = raw / 100;
  }

  return result;
}

export function mergePopulationData(
  totals: Record<string, number>,
  ages: Record<string, { under15: number; age15to64: number; over65: number }>,
  daytime: Record<string, number>,
): PopulationData {
  const result: PopulationData = {};

  for (const [area, total] of Object.entries(totals)) {
    const age = ages[area] || { under15: 0, age15to64: 0, over65: 0 };
    const ratio = daytime[area] ?? 1.0;
    const daytimePop = Math.round(total * ratio);

    result[area] = {
      total,
      under15: age.under15,
      age15to64: age.age15to64,
      over65: age.over65,
      daytimePopulation: daytimePop,
      daytimeRatio: Math.round(ratio * 100) / 100,
    };
  }

  return result;
}

async function main() {
  const apiKey = process.env.ESTAT_API_KEY;
  if (!apiKey) {
    console.error("ESTAT_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new EStatClient(apiKey);
  mkdirSync("../data", { recursive: true });

  console.log("1/3: 総人口データを取得中...");
  const { values: popValues } = await client.getStatsData({
    statsDataId: STAT_IDS.POPULATION_TOTAL,
    cdCat01: "0",
  });
  console.log(`  取得件数: ${popValues.length}`);
  const totals = parsePopulationTotal(popValues);
  console.log(`  市区町村数: ${Object.keys(totals).length}`);

  console.log("2/3: 年齢3区分データを取得中...");
  const { values: ageValues } = await client.getStatsData({
    statsDataId: STAT_IDS.POPULATION_AGE3,
    cdCat01: "0",
    cdCat02: "0",
    cdCat03: "1,2,3",
  });
  console.log(`  取得件数: ${ageValues.length}`);
  const ages = parseAgeRatios(ageValues);

  console.log("3/3: 昼夜間人口比を取得中...");
  const { values: daytimeValues } = await client.getStatsData({
    statsDataId: STAT_IDS.DAYTIME_POPULATION,
    cdCat01: "0",
    cdCat02: "00",
  });
  console.log(`  取得件数: ${daytimeValues.length}`);
  const daytime = parseDaytimeRatio(daytimeValues);

  const populationData = mergePopulationData(totals, ages, daytime);
  writeFileSync("../data/census_population.json", JSON.stringify(populationData, null, 2));
  console.log(`=> ../data/census_population.json に保存しました (${Object.keys(populationData).length}件)`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""))) {
  main().catch(console.error);
}
