import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EStatClient } from "../src/e-stat-client.js";
import type {
  EStatStatsListResponse,
  EStatMetaInfoResponse,
  EStatStatsDataResponse,
} from "../src/types.js";

function createMockFetch(responses: Array<{ ok: boolean; json: () => Promise<unknown> }>) {
  let callIndex = 0;
  return vi.fn(async () => {
    const res = responses[callIndex++];
    if (!res) throw new Error("No more mock responses");
    return res;
  });
}

function makeStatsListResponse(tables: Array<{ id: string; title: string }>): EStatStatsListResponse {
  return {
    GET_STATS_LIST: {
      RESULT: { STATUS: 0, ERROR_MSG: "", DATE: "2026-01-01" },
      DATALIST_INF: {
        NUMBER: tables.length,
        RESULT_INF: { FROM_NUMBER: 1, TO_NUMBER: tables.length },
        TABLE_INF: tables.map((t) => ({
          "@id": t.id,
          STAT_NAME: { "@code": "00200553", $: "経済センサス" },
          GOV_ORG: { "@code": "00200", $: "総務省" },
          STATISTICS_NAME: "経済センサス",
          TITLE: t.title,
          SURVEY_DATE: "202106",
        })),
      },
    },
  };
}

function makeMetaInfoResponse(): EStatMetaInfoResponse {
  return {
    GET_META_INFO: {
      RESULT: { STATUS: 0, ERROR_MSG: "", DATE: "2026-01-01" },
      METADATA_INF: {
        TABLE_INF: {
          "@id": "0003000001",
          STAT_NAME: { "@code": "00200553", $: "経済センサス" },
          GOV_ORG: { "@code": "00200", $: "総務省" },
          STATISTICS_NAME: "経済センサス",
          TITLE: "テスト統計表",
          SURVEY_DATE: "202106",
        },
        CLASS_INF: {
          CLASS_OBJ: [
            {
              "@id": "cat01",
              "@name": "産業分類",
              CLASS: [
                { "@code": "8311", "@name": "歯科診療所", "@level": "1" },
                { "@code": "7811", "@name": "美容業", "@level": "1" },
              ],
            },
            {
              "@id": "area",
              "@name": "地域",
              CLASS: [
                { "@code": "27128", "@name": "大阪市中央区", "@level": "3" },
              ],
            },
          ],
        },
      },
    },
  };
}

function makeStatsDataResponse(
  values: Array<{ area: string; cat01: string; value: string | null }>,
  nextKey?: number,
): EStatStatsDataResponse {
  return {
    GET_STATS_DATA: {
      RESULT: { STATUS: 0, ERROR_MSG: "", DATE: "2026-01-01" },
      STATISTICAL_DATA: {
        RESULT_INF: {
          TOTAL_NUMBER: values.length,
          FROM_NUMBER: 1,
          TO_NUMBER: values.length,
          ...(nextKey !== undefined ? { NEXT_KEY: nextKey } : {}),
        },
        CLASS_INF: {
          CLASS_OBJ: [],
        },
        DATA_INF: {
          VALUE: values.map((v) => ({
            "@area": v.area,
            "@cat01": v.cat01,
            $: v.value,
          })),
        },
      },
    },
  };
}

describe("EStatClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("getStatsList", () => {
    it("統計表一覧を検索して返す", async () => {
      const mockResponse = makeStatsListResponse([
        { id: "0003000001", title: "産業別事業所数" },
        { id: "0003000002", title: "従業者数" },
      ]);

      globalThis.fetch = createMockFetch([
        { ok: true, json: async () => mockResponse },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key");
      const result = await client.getStatsList({ statsCode: "00200553" });

      expect(result).toHaveLength(2);
      expect(result[0]["@id"]).toBe("0003000001");

      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = call[0] as string;
      expect(url).toContain("appId=test-api-key");
      expect(url).toContain("statsCode=00200553");
    });
  });

  describe("getMetaInfo", () => {
    it("統計表のメタ情報（分類コード一覧）を返す", async () => {
      const mockResponse = makeMetaInfoResponse();

      globalThis.fetch = createMockFetch([
        { ok: true, json: async () => mockResponse },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key");
      const result = await client.getMetaInfo("0003000001");

      expect(result.CLASS_OBJ).toHaveLength(2);
      const cat01 = result.CLASS_OBJ.find((c) => c["@id"] === "cat01");
      expect(cat01).toBeDefined();
      expect(Array.isArray(cat01!.CLASS)).toBe(true);
      expect((cat01!.CLASS as Array<unknown>).length).toBe(2);
    });
  });

  describe("getStatsData", () => {
    it("統計データを取得する", async () => {
      const mockResponse = makeStatsDataResponse([
        { area: "27128", cat01: "8311", value: "142" },
        { area: "27128", cat01: "7811", value: "234" },
      ]);

      globalThis.fetch = createMockFetch([
        { ok: true, json: async () => mockResponse },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key");
      const result = await client.getStatsData({ statsDataId: "0003000001" });

      expect(result.values).toHaveLength(2);
      expect(result.values[0]["@area"]).toBe("27128");
      expect(result.values[0]["$"]).toBe("142");
    });

    it("NEXT_KEYがある場合はページングで全データを取得する", async () => {
      const page1 = makeStatsDataResponse(
        [{ area: "27128", cat01: "8311", value: "142" }],
        2,
      );
      const page2 = makeStatsDataResponse([
        { area: "27127", cat01: "8311", value: "85" },
      ]);

      globalThis.fetch = createMockFetch([
        { ok: true, json: async () => page1 },
        { ok: true, json: async () => page2 },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key", { requestInterval: 0 });
      const result = await client.getStatsData({ statsDataId: "0003000001" });

      expect(result.values).toHaveLength(2);
      expect(result.values[0]["@area"]).toBe("27128");
      expect(result.values[1]["@area"]).toBe("27127");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("エラーハンドリング", () => {
    it("APIエラーステータスの場合に例外をスローする", async () => {
      const errorResponse: EStatStatsDataResponse = {
        GET_STATS_DATA: {
          RESULT: { STATUS: 1, ERROR_MSG: "パラメータエラー", DATE: "2026-01-01" },
          STATISTICAL_DATA: {
            RESULT_INF: { TOTAL_NUMBER: 0, FROM_NUMBER: 0, TO_NUMBER: 0 },
            CLASS_INF: { CLASS_OBJ: [] },
            DATA_INF: { VALUE: [] },
          },
        },
      };

      globalThis.fetch = createMockFetch([
        { ok: true, json: async () => errorResponse },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key");
      await expect(
        client.getStatsData({ statsDataId: "invalid" }),
      ).rejects.toThrow("パラメータエラー");
    });

    it("HTTPエラーの場合にリトライする", async () => {
      const successResponse = makeStatsDataResponse([
        { area: "27128", cat01: "8311", value: "142" },
      ]);

      globalThis.fetch = createMockFetch([
        { ok: false, json: async () => ({}) },
        { ok: true, json: async () => successResponse },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key", {
        requestInterval: 0,
        retryDelay: 0,
      });
      const result = await client.getStatsData({ statsDataId: "0003000001" });

      expect(result.values).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("リトライ回数超過で例外をスローする", async () => {
      globalThis.fetch = createMockFetch([
        { ok: false, json: async () => ({}) },
        { ok: false, json: async () => ({}) },
        { ok: false, json: async () => ({}) },
      ]) as unknown as typeof fetch;

      const client = new EStatClient("test-api-key", {
        maxRetries: 3,
        requestInterval: 0,
        retryDelay: 0,
      });
      await expect(
        client.getStatsData({ statsDataId: "0003000001" }),
      ).rejects.toThrow();
    });
  });
});
