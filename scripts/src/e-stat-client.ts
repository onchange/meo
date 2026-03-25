import type {
  EStatStatsListResponse,
  EStatMetaInfoResponse,
  EStatStatsDataResponse,
  EStatTableInfo,
  EStatClassObj,
  EStatValue,
  GetStatsDataParams,
} from "./types.js";

const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json";

interface EStatClientOptions {
  requestInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class EStatClient {
  private apiKey: string;
  private requestInterval: number;
  private maxRetries: number;
  private retryDelay: number;
  private lastRequestTime = 0;

  constructor(apiKey: string, options: EStatClientOptions = {}) {
    this.apiKey = apiKey;
    this.requestInterval = options.requestInterval ?? 1000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
  }

  async getStatsList(params: {
    statsCode?: string;
    searchWord?: string;
  }): Promise<EStatTableInfo[]> {
    const url = new URL(`${BASE_URL}/getStatsList`);
    url.searchParams.set("appId", this.apiKey);
    if (params.statsCode) url.searchParams.set("statsCode", params.statsCode);
    if (params.searchWord) url.searchParams.set("searchWord", params.searchWord);

    const data = (await this.fetchWithRetry(url.toString())) as EStatStatsListResponse;
    return data.GET_STATS_LIST.DATALIST_INF.TABLE_INF;
  }

  async getMetaInfo(statsDataId: string): Promise<{ CLASS_OBJ: EStatClassObj[] }> {
    const url = new URL(`${BASE_URL}/getMetaInfo`);
    url.searchParams.set("appId", this.apiKey);
    url.searchParams.set("statsDataId", statsDataId);

    const data = (await this.fetchWithRetry(url.toString())) as EStatMetaInfoResponse;
    return data.GET_META_INFO.METADATA_INF.CLASS_INF;
  }

  async getStatsData(
    params: GetStatsDataParams,
  ): Promise<{ values: EStatValue[]; classInfo: EStatClassObj[] }> {
    const allValues: EStatValue[] = [];
    let classInfo: EStatClassObj[] = [];
    let startPosition: number | undefined = params.startPosition;

    while (true) {
      const url = new URL(`${BASE_URL}/getStatsData`);
      url.searchParams.set("appId", this.apiKey);
      url.searchParams.set("statsDataId", params.statsDataId);
      url.searchParams.set("limit", String(params.limit ?? 100000));
      if (startPosition !== undefined) {
        url.searchParams.set("startPosition", String(startPosition));
      }
      if (params.cdArea) url.searchParams.set("cdArea", params.cdArea);
      if (params.cdCat01) url.searchParams.set("cdCat01", params.cdCat01);
      if (params.cdCat02) url.searchParams.set("cdCat02", params.cdCat02);
      if (params.cdCat03) url.searchParams.set("cdCat03", params.cdCat03);
      if (params.cdTab) url.searchParams.set("cdTab", params.cdTab);

      const data = (await this.fetchWithRetry(url.toString())) as EStatStatsDataResponse;
      const result = data.GET_STATS_DATA.RESULT;
      if (result.STATUS !== 0) {
        throw new Error(result.ERROR_MSG || `e-Stat API error: status ${result.STATUS}`);
      }

      const stats = data.GET_STATS_DATA.STATISTICAL_DATA;
      allValues.push(...stats.DATA_INF.VALUE);
      classInfo = stats.CLASS_INF.CLASS_OBJ;

      const nextKey = stats.RESULT_INF.NEXT_KEY;
      if (nextKey === undefined) break;
      startPosition = nextKey;
    }

    return { values: allValues, classInfo };
  }

  private async fetchWithRetry(url: string): Promise<unknown> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      await this.throttle();

      try {
        const response = await fetch(url);
        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status}`);
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        return await response.json();
      } catch (err) {
        lastError = err as Error;
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestInterval) {
      await this.delay(this.requestInterval - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
