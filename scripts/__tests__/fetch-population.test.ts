import { describe, it, expect } from "vitest";
import { parsePopulationTotal, parseAgeRatios, parseDaytimeRatio, mergePopulationData } from "../src/fetch-population.js";
import type { EStatValue } from "../src/types.js";

describe("parsePopulationTotal", () => {
  it("市区町村別の総人口を返す", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "0", $: "107335" },
      { "@area": "27127", "@cat01": "0", $: "136704" },
      { "@area": "27128", "@cat01": "1", $: "53000" },
    ];

    const result = parsePopulationTotal(values);
    expect(result["27128"]).toBe(107335);
    expect(result["27127"]).toBe(136704);
  });

  it("全国・都道府県コードを除外する", () => {
    const values: EStatValue[] = [
      { "@area": "00000", "@cat01": "0", $: "126000000" },
      { "@area": "27000", "@cat01": "0", $: "8800000" },
      { "@area": "27128", "@cat01": "0", $: "107335" },
    ];

    const result = parsePopulationTotal(values);
    expect(result["00000"]).toBeUndefined();
    expect(result["27000"]).toBeUndefined();
    expect(result["27128"]).toBe(107335);
  });
});

describe("parseAgeRatios", () => {
  it("年齢3区分の割合を返す", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "0", "@cat02": "0", "@cat03": "1", $: "8.2" },
      { "@area": "27128", "@cat01": "0", "@cat02": "0", "@cat03": "2", $: "71.5" },
      { "@area": "27128", "@cat01": "0", "@cat02": "0", "@cat03": "3", $: "20.3" },
    ];

    const result = parseAgeRatios(values);
    expect(result["27128"].under15).toBeCloseTo(8.2);
    expect(result["27128"].age15to64).toBeCloseTo(71.5);
    expect(result["27128"].over65).toBeCloseTo(20.3);
  });

  it("男女別データは除外し総数のみ使う", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "0", "@cat02": "0", "@cat03": "1", $: "8.2" },
      { "@area": "27128", "@cat01": "0", "@cat02": "1", "@cat03": "1", $: "9.0" },
    ];

    const result = parseAgeRatios(values);
    expect(result["27128"].under15).toBeCloseTo(8.2);
  });
});

describe("parseDaytimeRatio", () => {
  it("昼夜間人口比を返す", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "0", "@cat02": "00", $: "823.4" },
      { "@area": "27127", "@cat01": "0", "@cat02": "00", $: "315.2" },
    ];

    const result = parseDaytimeRatio(values);
    expect(result["27128"]).toBeCloseTo(8.234);
    expect(result["27127"]).toBeCloseTo(3.152);
  });

  it("年齢別データは除外し総数のみ使う", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "0", "@cat02": "00", $: "823.4" },
      { "@area": "27128", "@cat01": "0", "@cat02": "01", $: "100.0" },
    ];

    const result = parseDaytimeRatio(values);
    expect(result["27128"]).toBeCloseTo(8.234);
  });
});

describe("mergePopulationData", () => {
  it("3つのデータソースを統合する", () => {
    const totals = { "27128": 107335 };
    const ages = { "27128": { under15: 8.2, age15to64: 71.5, over65: 20.3 } };
    const daytime = { "27128": 8.23 };

    const result = mergePopulationData(totals, ages, daytime);

    expect(result["27128"].total).toBe(107335);
    expect(result["27128"].under15).toBeCloseTo(8.2);
    expect(result["27128"].age15to64).toBeCloseTo(71.5);
    expect(result["27128"].over65).toBeCloseTo(20.3);
    expect(result["27128"].daytimeRatio).toBeCloseTo(8.23);
  });

  it("昼夜間人口比がない市区町村はデフォルト1.0にする", () => {
    const totals = { "99999": 5000 };
    const ages = { "99999": { under15: 10, age15to64: 60, over65: 30 } };
    const daytime = {};

    const result = mergePopulationData(totals, ages, daytime);
    expect(result["99999"].daytimeRatio).toBe(1.0);
  });

  it("年齢データがない市区町村はデフォルト0にする", () => {
    const totals = { "99999": 5000 };
    const ages = {};
    const daytime = { "99999": 1.2 };

    const result = mergePopulationData(totals, ages, daytime);
    expect(result["99999"].under15).toBe(0);
    expect(result["99999"].age15to64).toBe(0);
    expect(result["99999"].over65).toBe(0);
  });
});
