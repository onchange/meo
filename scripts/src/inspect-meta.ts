import "dotenv/config";
import { EStatClient } from "./e-stat-client.js";
import { STAT_IDS } from "./stat-ids.js";
import type { EStatClass } from "./types.js";

const apiKey = process.env.ESTAT_API_KEY;
if (!apiKey) {
  console.error("ESTAT_API_KEY environment variable is required");
  process.exit(1);
}

const client = new EStatClient(apiKey);

async function inspectTable(id: string, label: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${label} (${id})`);
  console.log("=".repeat(60));

  const meta = await client.getMetaInfo(id);
  for (const obj of meta.CLASS_OBJ) {
    const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
    console.log(`\n--- ${obj["@name"]} (${obj["@id"]}) --- [${classes.length}件]`);
    const sample = classes.slice(0, 20);
    for (const c of sample) {
      console.log(`  ${c["@code"]}  ${c["@name"]}  (level: ${c["@level"]}${c["@parentCode"] ? `, parent: ${c["@parentCode"]}` : ""})`);
    }
    if (classes.length > 20) {
      console.log(`  ... 他 ${classes.length - 20}件`);
    }
  }
}

async function main() {
  await inspectTable(STAT_IDS.CENSUS_BUSINESS, "経済センサス - 事業所数");
  await inspectTable(STAT_IDS.POPULATION_TOTAL, "国勢調査 - 総人口");
  await inspectTable(STAT_IDS.POPULATION_AGE3, "国勢調査 - 年齢3区分");
  await inspectTable(STAT_IDS.DAYTIME_POPULATION, "国勢調査 - 昼夜間人口比");
}

main().catch(console.error);
