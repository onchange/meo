import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { INDUSTRY_CODES } from "./stat-ids.js";
import type { BusinessData, PopulationData, Averages, IndustryAverage } from "./types.js";

export function calculateAverages(
  businesses: BusinessData,
  population: PopulationData,
  municipalities: Record<string, { name: string; prefCode: string; prefName: string }>,
): Averages {
  const industryCodes = Object.keys(INDUSTRY_CODES);

  const national: Record<string, { establishments: number; population: number }> = {};
  const prefecture: Record<string, Record<string, { establishments: number; population: number }>> = {};

  for (const code of industryCodes) {
    national[code] = { establishments: 0, population: 0 };
  }

  for (const [areaCode, muni] of Object.entries(municipalities)) {
    const pop = population[areaCode];
    if (!pop || pop.total === 0) continue;

    const prefCode = muni.prefCode;
    if (!prefecture[prefCode]) {
      prefecture[prefCode] = {};
      for (const code of industryCodes) {
        prefecture[prefCode][code] = { establishments: 0, population: 0 };
      }
    }

    const biz = businesses[areaCode] || {};
    for (const code of industryCodes) {
      const count = biz[code] || 0;
      national[code].establishments += count;
      national[code].population += pop.total;
      prefecture[prefCode][code].establishments += count;
      prefecture[prefCode][code].population += pop.total;
    }
  }

  function toAverage(acc: { establishments: number; population: number }): IndustryAverage {
    return {
      totalEstablishments: acc.establishments,
      totalPopulation: acc.population,
      perCapita: acc.population > 0
        ? Math.round((acc.establishments / acc.population) * 10000 * 100) / 100
        : 0,
    };
  }

  const result: Averages = {
    national: {},
    prefecture: {},
  };

  for (const code of industryCodes) {
    result.national[code] = toAverage(national[code]);
  }

  for (const [prefCode, industries] of Object.entries(prefecture)) {
    result.prefecture[prefCode] = {};
    for (const code of industryCodes) {
      result.prefecture[prefCode][code] = toAverage(industries[code]);
    }
  }

  return result;
}

async function main() {
  mkdirSync("../data", { recursive: true });

  console.log("データを読み込み中...");
  const businesses: BusinessData = JSON.parse(readFileSync("../data/census_businesses.json", "utf-8"));
  const population: PopulationData = JSON.parse(readFileSync("../data/census_population.json", "utf-8"));
  const municipalities = JSON.parse(readFileSync("../data/municipalities_base.json", "utf-8"));

  console.log("平均値を算出中...");
  const averages = calculateAverages(businesses, population, municipalities);

  writeFileSync("../data/averages.json", JSON.stringify(averages, null, 2));
  console.log("=> ../data/averages.json に保存しました");

  console.log("\n=== 全国平均（人口1万人あたり事業所数）===");
  for (const [code, avg] of Object.entries(averages.national)) {
    console.log(`  ${code} (${INDUSTRY_CODES[code]}): ${avg.perCapita}`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""))) {
  main().catch(console.error);
}
