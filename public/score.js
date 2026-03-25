function calculateCompetitionScore(perCapita, nationalAvgPerCapita) {
  if (nationalAvgPerCapita === 0) return 0;
  const ratio = perCapita / nationalAvgPerCapita;
  return Math.min(100, ratio * 50);
}

function calculatePopulationScore(population) {
  return Math.min(100, population / 3000);
}

function calculateDaytimeScore(daytimeRatio) {
  return Math.min(100, daytimeRatio * 50);
}

function calculateTotalScore(competitionScore, populationScore, daytimeScore) {
  return Math.round(
    competitionScore * 0.4 + populationScore * 0.3 + daytimeScore * 0.3
  );
}

function getScoreLabel(score) {
  if (score >= 80) return "MEO効果: 大";
  if (score >= 60) return "MEO効果: 中";
  return "MEO効果: 小";
}

function getScoreComment(score) {
  if (score >= 80)
    return "競合密度が高く、昼間人口も豊富。MEO対策で差別化する効果が大きいエリアです。";
  if (score >= 60)
    return "一定の競合があり、MEO対策で上位表示を狙う価値があるエリアです。";
  return "競合は比較的少ないですが、早期のMEO対策で先行者優位を確保できます。";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateCompetitionScore,
    calculatePopulationScore,
    calculateDaytimeScore,
    calculateTotalScore,
    getScoreLabel,
    getScoreComment,
  };
}
