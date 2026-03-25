import { describe, it, expect } from "vitest";
import { calculateAverages } from "../src/calculate-averages.js";
import type { BusinessData, PopulationData } from "../src/types.js";

describe("calculateAverages", () => {
  const businesses: BusinessData = {
    "13101": { "833": 120, "783": 200 },
    "13102": { "833": 80, "783": 150 },
    "27128": { "833": 142, "783": 234 },
  };

  const population: PopulationData = {
    "13101": { total: 67000, under15: 8, age15to64: 72, over65: 20, daytimePopulation: 850000, daytimeRatio: 12.7 },
    "13102": { total: 170000, under15: 10, age15to64: 70, over65: 20, daytimePopulation: 610000, daytimeRatio: 3.6 },
    "27128": { total: 107000, under15: 8, age15to64: 72, over65: 20, daytimePopulation: 880000, daytimeRatio: 8.2 },
  };

  const municipalities: Record<string, { name: string; prefCode: string; prefName: string }> = {
    "13101": { name: "千代田区", prefCode: "13", prefName: "東京都" },
    "13102": { name: "中央区", prefCode: "13", prefName: "東京都" },
    "27128": { name: "中央区", prefCode: "27", prefName: "大阪府" },
  };

  it("全国平均の人口1万人あたり事業所数を正しく算出する", () => {
    const result = calculateAverages(businesses, population, municipalities);

    const totalPop = 67000 + 170000 + 107000;
    const totalDental = 120 + 80 + 142;
    const expectedPerCapita = (totalDental / totalPop) * 10000;

    expect(result.national["833"].totalEstablishments).toBe(totalDental);
    expect(result.national["833"].totalPopulation).toBe(totalPop);
    expect(result.national["833"].perCapita).toBeCloseTo(expectedPerCapita, 1);
  });

  it("都道府県平均を正しく算出する", () => {
    const result = calculateAverages(businesses, population, municipalities);

    const tokyoPop = 67000 + 170000;
    const tokyoDental = 120 + 80;
    const expectedPerCapita = (tokyoDental / tokyoPop) * 10000;

    expect(result.prefecture["13"]["833"].totalEstablishments).toBe(tokyoDental);
    expect(result.prefecture["13"]["833"].totalPopulation).toBe(tokyoPop);
    expect(result.prefecture["13"]["833"].perCapita).toBeCloseTo(expectedPerCapita, 1);
  });

  it("人口データがない市区町村は無視する", () => {
    const biz: BusinessData = {
      "13101": { "833": 120 },
      "99999": { "833": 50 },
    };
    const pop: PopulationData = {
      "13101": { total: 67000, under15: 8, age15to64: 72, over65: 20, daytimePopulation: 850000, daytimeRatio: 12.7 },
    };
    const muni = {
      "13101": { name: "千代田区", prefCode: "13", prefName: "東京都" },
      "99999": { name: "不明村", prefCode: "99", prefName: "不明県" },
    };

    const result = calculateAverages(biz, pop, muni);
    expect(result.national["833"].totalPopulation).toBe(67000);
  });

  it("事業所数がない業種は0として計算する", () => {
    const biz: BusinessData = {
      "13101": { "833": 120 },
    };
    const pop: PopulationData = {
      "13101": { total: 67000, under15: 8, age15to64: 72, over65: 20, daytimePopulation: 850000, daytimeRatio: 12.7 },
    };
    const muni = {
      "13101": { name: "千代田区", prefCode: "13", prefName: "東京都" },
    };

    const result = calculateAverages(biz, pop, muni);
    expect(result.national["783"]).toBeDefined();
    expect(result.national["783"].totalEstablishments).toBe(0);
    expect(result.national["783"].perCapita).toBe(0);
  });
});
