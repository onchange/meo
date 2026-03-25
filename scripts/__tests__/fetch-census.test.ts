import { describe, it, expect } from "vitest";
import { parseBusinessData } from "../src/fetch-census.js";
import type { EStatValue } from "../src/types.js";

describe("parseBusinessData", () => {
  it("e-Statのレスポンスから市区町村×業種の事業所数マップを生成する", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "833", $: "142" },
      { "@area": "27128", "@cat01": "783", $: "234" },
      { "@area": "27127", "@cat01": "833", $: "85" },
      { "@area": "27127", "@cat01": "783", $: "120" },
    ];

    const result = parseBusinessData(values);

    expect(result["27128"]["833"]).toBe(142);
    expect(result["27128"]["783"]).toBe(234);
    expect(result["27127"]["833"]).toBe(85);
    expect(result["27127"]["783"]).toBe(120);
  });

  it("値がnullの場合は0として扱う", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "833", $: null },
    ];

    const result = parseBusinessData(values);
    expect(result["27128"]["833"]).toBe(0);
  });

  it("秘匿記号（'-'や'x'）の場合は0として扱う", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "833", $: "-" },
      { "@area": "27128", "@cat01": "783", $: "x" },
    ];

    const result = parseBusinessData(values);
    expect(result["27128"]["833"]).toBe(0);
    expect(result["27128"]["783"]).toBe(0);
  });

  it("全国コード(00000)や都道府県コード(XX000)を除外する", () => {
    const values: EStatValue[] = [
      { "@area": "00000", "@cat01": "833", $: "68000" },
      { "@area": "27000", "@cat01": "833", $: "5000" },
      { "@area": "27128", "@cat01": "833", $: "142" },
    ];

    const result = parseBusinessData(values);
    expect(result["00000"]).toBeUndefined();
    expect(result["27000"]).toBeUndefined();
    expect(result["27128"]["833"]).toBe(142);
  });

  it("対象業種以外のコードを除外する", () => {
    const values: EStatValue[] = [
      { "@area": "27128", "@cat01": "833", $: "142" },
      { "@area": "27128", "@cat01": "999", $: "50" },
    ];

    const result = parseBusinessData(values);
    expect(result["27128"]["833"]).toBe(142);
    expect(result["27128"]["999"]).toBeUndefined();
  });
});
