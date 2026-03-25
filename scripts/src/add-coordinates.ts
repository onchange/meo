import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";

interface ExternalMunicipality {
  code: string;
  name_kanji: string;
  lat: string;
  lon: string;
  prefecture_kanji: string;
}

interface MunicipalityEntry {
  name: string;
  prefCode: string;
  prefName: string;
  lat?: number;
  lng?: number;
}

async function main() {
  const response = await fetch(
    "https://raw.githubusercontent.com/piuccio/open-data-jp-municipalities/master/municipalities.json",
  );
  const externalData: ExternalMunicipality[] = await response.json();

  const coordMap = new Map<string, { lat: number; lng: number }>();
  for (const m of externalData) {
    const code5 = m.code.slice(0, 5);
    coordMap.set(code5, {
      lat: parseFloat(m.lat),
      lng: parseFloat(m.lon),
    });
  }

  const municipalities: Record<string, MunicipalityEntry> = JSON.parse(
    readFileSync("../data/municipalities_base.json", "utf-8"),
  );

  let matched = 0;
  let unmatched = 0;

  for (const [code, muni] of Object.entries(municipalities)) {
    const coord = coordMap.get(code);
    if (coord) {
      muni.lat = coord.lat;
      muni.lng = coord.lng;
      matched++;
    } else {
      const parentCode = code.slice(0, 3) + "00";
      const parentCoord = coordMap.get(parentCode);
      if (parentCoord) {
        muni.lat = parentCoord.lat;
        muni.lng = parentCoord.lng;
        matched++;
      } else {
        unmatched++;
      }
    }
  }

  writeFileSync("../data/municipalities.json", JSON.stringify(municipalities, null, 2));
  console.log(`座標マッチ: ${matched}件, 未マッチ: ${unmatched}件`);
  console.log("=> ../data/municipalities.json に保存しました");
}

main().catch(console.error);
