import "dotenv/config";
import { EStatClient } from "./e-stat-client.js";
import { STAT_IDS } from "./stat-ids.js";

const apiKey = process.env.ESTAT_API_KEY;
if (!apiKey) {
  console.error("ESTAT_API_KEY environment variable is required");
  process.exit(1);
}

const client = new EStatClient(apiKey);

async function main() {
  const meta = await client.getMetaInfo(STAT_IDS.CENSUS_BUSINESS);
  const cat01 = meta.CLASS_OBJ.find((c) => c["@id"] === "cat01");
  if (!cat01) return;
  const classes = Array.isArray(cat01.CLASS) ? cat01.CLASS : [cat01.CLASS];

  const matches = classes.filter((c) => c["@code"].startsWith("68") || c["@code"].startsWith("K"));
  for (const m of matches) {
    console.log(`  ${m["@code"]}  ${m["@name"]}  (level: ${m["@level"]}, parent: ${m["@parentCode"] || "-"})`);
  }
}

main().catch(console.error);
