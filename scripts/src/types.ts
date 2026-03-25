export interface EStatStatsListResponse {
  GET_STATS_LIST: {
    RESULT: EStatResult;
    DATALIST_INF: {
      NUMBER: number;
      RESULT_INF: { FROM_NUMBER: number; TO_NUMBER: number };
      TABLE_INF: EStatTableInfo[];
    };
  };
}

export interface EStatMetaInfoResponse {
  GET_META_INFO: {
    RESULT: EStatResult;
    METADATA_INF: {
      TABLE_INF: EStatTableInfo;
      CLASS_INF: {
        CLASS_OBJ: EStatClassObj[];
      };
    };
  };
}

export interface EStatStatsDataResponse {
  GET_STATS_DATA: {
    RESULT: EStatResult;
    STATISTICAL_DATA: {
      RESULT_INF: {
        TOTAL_NUMBER: number;
        FROM_NUMBER: number;
        TO_NUMBER: number;
        NEXT_KEY?: number;
      };
      CLASS_INF: {
        CLASS_OBJ: EStatClassObj[];
      };
      DATA_INF: {
        NOTE?: EStatNote[];
        VALUE: EStatValue[];
      };
    };
  };
}

export interface EStatResult {
  STATUS: number;
  ERROR_MSG: string;
  DATE: string;
}

export interface EStatTableInfo {
  "@id": string;
  STAT_NAME: { "@code": string; $: string };
  GOV_ORG: { "@code": string; $: string };
  STATISTICS_NAME: string;
  TITLE:
    | string
    | { "@no": string; $: string };
  SURVEY_DATE: string;
  [key: string]: unknown;
}

export interface EStatClassObj {
  "@id": string;
  "@name": string;
  CLASS: EStatClass | EStatClass[];
}

export interface EStatClass {
  "@code": string;
  "@name": string;
  "@level": string;
  "@unit"?: string;
  "@parentCode"?: string;
}

export interface EStatValue {
  "@tab"?: string;
  "@cat01"?: string;
  "@cat02"?: string;
  "@cat03"?: string;
  "@area"?: string;
  "@time"?: string;
  "@unit"?: string;
  $: string | null;
}

export interface EStatNote {
  "@char": string;
  $: string;
}

export interface Municipality {
  code: string;
  name: string;
  prefCode: string;
  prefName: string;
  lat: number;
  lng: number;
}

export interface BusinessData {
  [municipalityCode: string]: {
    [industryCode: string]: number;
  };
}

export interface PopulationData {
  [municipalityCode: string]: {
    total: number;
    under15: number;
    age15to64: number;
    over65: number;
    daytimePopulation: number;
    daytimeRatio: number;
  };
}

export interface IndustryAverage {
  totalEstablishments: number;
  totalPopulation: number;
  perCapita: number;
}

export interface Averages {
  national: {
    [industryCode: string]: IndustryAverage;
  };
  prefecture: {
    [prefCode: string]: {
      [industryCode: string]: IndustryAverage;
    };
  };
}

export interface GetStatsDataParams {
  statsDataId: string;
  cdArea?: string;
  cdCat01?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdTab?: string;
  startPosition?: number;
  limit?: number;
}
