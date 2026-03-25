import "dotenv/config";
import { EStatClient } from "./e-stat-client.js";
import { STAT_IDS, INDUSTRY_CODES } from "./stat-ids.js";
import type { EStatClass } from "./types.js";

const apiKey = process.env.ESTAT_API_KEY;
if (!apiKey) {
  console.error("ESTAT_API_KEY environment variable is required");
  process.exit(1);
}

const client = new EStatClient(apiKey);

async function main() {
  const meta = await client.getMetaInfo(STAT_IDS.CENSUS_BUSINESS);
  const cat01 = meta.CLASS_OBJ.find((c) => c["@id"] === "cat01");
  if (!cat01) {
    console.error("cat01 not found");
    return;
  }
  const classes = Array.isArray(cat01.CLASS) ? cat01.CLASS : [cat01.CLASS];

  const targetCodes = Object.keys(INDUSTRY_CODES);
  console.log("=== 対象業種コードの照合 ===\n");

  for (const code of targetCodes) {
    const match = classes.find((c) => c["@code"] === code);
    if (match) {
      console.log(`[OK] ${code} → ${match["@name"]} (level: ${match["@level"]}, parent: ${match["@parentCode"] || "-"})`);
    } else {
      console.log(`[NG] ${code} (${INDUSTRY_CODES[code]}) → 見つかりません`);
      const partial = classes.filter((c) => c["@code"].startsWith(code.slice(0, 2)));
      if (partial.length > 0) {
        console.log(`     近いコード:`);
        for (const p of partial.slice(0, 5)) {
          console.log(`       ${p["@code"]}  ${p["@name"]}  (level: ${p["@level"]})`);
        }
      }
    }
  }
}

main().catch(console.error);
