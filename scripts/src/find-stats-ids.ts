import "dotenv/config";
import { EStatClient } from "./e-stat-client.js";

const apiKey = process.env.ESTAT_API_KEY;
if (!apiKey) {
  console.error("ESTAT_API_KEY environment variable is required");
  process.exit(1);
}

const client = new EStatClient(apiKey);

async function searchTables(statsCode: string, label: string) {
  console.log(`\n=== ${label} (${statsCode}) ===\n`);
  const tables = await client.getStatsList({ statsCode });
  for (const t of tables) {
    const title = typeof t.TITLE === "string" ? t.TITLE : t.TITLE.$;
    console.log(`ID: ${t["@id"]}  ${title}  (${t.SURVEY_DATE})`);
  }
  console.log(`\n合計: ${tables.length}件`);
}

async function main() {
  await searchTables("00200553", "経済センサス-活動調査");
  await searchTables("00200521", "国勢調査");
}

main().catch(console.error);
