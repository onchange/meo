export const STAT_IDS = {
  CENSUS_BUSINESS: "0004005687",
  POPULATION_TOTAL: "0003433219",
  POPULATION_AGE3: "0003445163",
  DAYTIME_POPULATION: "0003454499",
} as const;

export const INDUSTRY_CODES: Record<string, string> = {
  "833": "歯科診療所",
  "832": "一般診療所（内科等）",
  "783": "美容業（美容院）",
  "782": "理容業",
  "76": "飲食店",
  "835": "療術業（整骨院・鍼灸院等）",
  "823": "学習塾",
  "682": "不動産代理業・仲介業",
};
