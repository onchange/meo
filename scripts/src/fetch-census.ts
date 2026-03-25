import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { EStatClient } from "./e-stat-client.js";
import { STAT_IDS, INDUSTRY_CODES } from "./stat-ids.js";
import type { EStatValue, EStatClass, BusinessData } from "./types.js";

const TARGET_INDUSTRY_CODES = new Set(Object.keys(INDUSTRY_CODES));

export function parseBusinessData(values: EStatValue[]): BusinessData {
  const data: BusinessData = {};

  for (const v of values) {
    const area = v["@area"];
    const cat01 = v["@cat01"];
    if (!area || !cat01) continue;

    if (area === "00000" || area.endsWith("000")) continue;

    if (!TARGET_INDUSTRY_CODES.has(cat01)) continue;

    const raw = v.$;
    const count = raw === null || raw === "-" || raw === "x" || raw === "…" || raw === "***"
      ? 0
      : parseInt(raw, 10);

    if (!data[area]) data[area] = {};
    data[area][cat01] = isNaN(count) ? 0 : count;
  }

  return data;
}

async function main() {
  const apiKey = process.env.ESTAT_API_KEY;
  if (!apiKey) {
    console.error("ESTAT_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new EStatClient(apiKey);
  const industryCodes = Object.keys(INDUSTRY_CODES).join(",");

  console.log(`対象業種: ${industryCodes}`);
  console.log("経済センサスデータを取得中...");

  const { values, classInfo } = await client.getStatsData({
    statsDataId: STAT_IDS.CENSUS_BUSINESS,
    cdCat01: industryCodes,
  });

  console.log(`取得件数: ${values.length}`);

  const data = parseBusinessData(values);
  const municipalityCount = Object.keys(data).length;
  console.log(`市区町村数: ${municipalityCount}`);

  mkdirSync("../data", { recursive: true });
  writeFileSync("../data/census_businesses.json", JSON.stringify(data, null, 2));
  console.log("=> ../data/census_businesses.json に保存しました");

  const areaObj = classInfo.find((c) => c["@id"] === "area");
  if (areaObj) {
    const classes = Array.isArray(areaObj.CLASS) ? areaObj.CLASS : [areaObj.CLASS];
    const municipalities: Record<string, { name: string; prefCode: string; prefName: string }> = {};
    const prefNames: Record<string, string> = {};

    for (const c of classes) {
      const code = c["@code"];
      if (code === "00000") continue;
      if (code.endsWith("000")) {
        prefNames[code.slice(0, 2)] = c["@name"];
        continue;
      }
      const prefCode = code.slice(0, 2);
      municipalities[code] = {
        name: c["@name"],
        prefCode,
        prefName: prefNames[prefCode] || "",
      };
    }

    writeFileSync("../data/municipalities_base.json", JSON.stringify(municipalities, null, 2));
    console.log(`=> ../data/municipalities_base.json に保存しました (${Object.keys(municipalities).length}件)`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""))) {
  main().catch(console.error);
}
