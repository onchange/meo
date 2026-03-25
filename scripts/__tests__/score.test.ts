import { describe, it, expect } from "vitest";
import {
  calculateCompetitionScore,
  calculatePopulationScore,
  calculateDaytimeScore,
  calculateTotalScore,
  getScoreLabel,
  getScoreComment,
} from "../../public/score.js";

describe("calculateCompetitionScore", () => {
  it("全国平均と同じ場合は50点", () => {
    expect(calculateCompetitionScore(5.37, 5.37)).toBeCloseTo(50, 0);
  });

  it("全国平均の2倍で100点（上限キャップ）", () => {
    expect(calculateCompetitionScore(10.74, 5.37)).toBe(100);
  });

  it("全国平均の3倍でも100点（上限キャップ）", () => {
    expect(calculateCompetitionScore(16.11, 5.37)).toBe(100);
  });

  it("全国平均の半分で25点", () => {
    expect(calculateCompetitionScore(2.685, 5.37)).toBeCloseTo(25, 0);
  });

  it("0の場合は0点", () => {
    expect(calculateCompetitionScore(0, 5.37)).toBe(0);
  });
});

describe("calculatePopulationScore", () => {
  it("人口30万人以上で100点", () => {
    expect(calculatePopulationScore(300000)).toBe(100);
  });

  it("人口50万人でも100点（上限キャップ）", () => {
    expect(calculatePopulationScore(500000)).toBe(100);
  });

  it("人口15万人で50点", () => {
    expect(calculatePopulationScore(150000)).toBeCloseTo(50, 0);
  });

  it("人口0で0点", () => {
    expect(calculatePopulationScore(0)).toBe(0);
  });
});

describe("calculateDaytimeScore", () => {
  it("昼夜間人口比1.0で50点", () => {
    expect(calculateDaytimeScore(1.0)).toBeCloseTo(50, 0);
  });

  it("昼夜間人口比2.0で100点", () => {
    expect(calculateDaytimeScore(2.0)).toBe(100);
  });

  it("昼夜間人口比5.0でも100点（上限キャップ）", () => {
    expect(calculateDaytimeScore(5.0)).toBe(100);
  });

  it("昼夜間人口比0.5で25点", () => {
    expect(calculateDaytimeScore(0.5)).toBeCloseTo(25, 0);
  });
});

describe("calculateTotalScore", () => {
  it("各サブスコアの加重平均を四捨五入で返す", () => {
    const result = calculateTotalScore(80, 60, 70);
    expect(result).toBe(Math.round(80 * 0.4 + 60 * 0.3 + 70 * 0.3));
  });

  it("全て100なら100", () => {
    expect(calculateTotalScore(100, 100, 100)).toBe(100);
  });

  it("全て0なら0", () => {
    expect(calculateTotalScore(0, 0, 0)).toBe(0);
  });
});

describe("getScoreLabel", () => {
  it("80以上でMEO効果: 大", () => {
    expect(getScoreLabel(80)).toBe("MEO効果: 大");
    expect(getScoreLabel(100)).toBe("MEO効果: 大");
  });

  it("60-79でMEO効果: 中", () => {
    expect(getScoreLabel(60)).toBe("MEO効果: 中");
    expect(getScoreLabel(79)).toBe("MEO効果: 中");
  });

  it("59以下でMEO効果: 小", () => {
    expect(getScoreLabel(59)).toBe("MEO効果: 小");
    expect(getScoreLabel(0)).toBe("MEO効果: 小");
  });
});

describe("getScoreComment", () => {
  it("スコア帯に応じたコメントを返す", () => {
    expect(getScoreComment(85)).toContain("差別化する効果が大きい");
    expect(getScoreComment(70)).toContain("上位表示を狙う価値");
    expect(getScoreComment(40)).toContain("先行者優位");
  });
});
