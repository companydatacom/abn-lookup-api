/**
 * @companydata/abn-lookup-api
 *
 * A thin, typed convenience wrapper around the CompanyData API for Australian Business Register.
 * It is not a separate API: it is the same `@companydata/companydata-sdk`
 * client with the country pinned to AU and a register-specific helper on
 * top, so you can write `client.getByAbn("...")` instead of assembling
 * query parameters by hand.
 *
 * One schema, one key across every CompanyData register.
 */
import {
  ApiClient,
  type ApiClientConfig,
  type CompanyExportParams,
  type CompanyExportScrollResponse,
  type CompanyExportStandardResponse,
  type CompanySearchParams,
  type CompanySearchResponse,
  type RequestOptions
} from "@companydata/companydata-sdk";

export const COUNTRY_CODE = "AU" as const;

export type AbnLookupSearchParams = Omit<CompanySearchParams, "countryCode">;
export type AbnLookupExportParams = Omit<CompanyExportParams, "countryCode">;
export interface AbnLookupClientConfig extends ApiClientConfig {}

/** Client for Australian Business Register data. */
export class AbnLookupClient {
  private readonly api: ApiClient;

  constructor(config: AbnLookupClientConfig) {
    this.api = new ApiClient(config);
  }

  /** Search businesses. `countryCode` is fixed to "AU". */
  search(params: AbnLookupSearchParams = {}, options?: RequestOptions): Promise<CompanySearchResponse> {
    return this.api.company.search({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Look up one business by its ABN. Returns the first match, or null. */
  async getByAbn(id: string, options?: RequestOptions): Promise<Record<string, unknown> | null> {
    const clean = id.replace(/\s+/g, "");
    const response = await this.api.company.search(
      { nationalId: clean, countryCode: COUNTRY_CODE, pageSize: 1 },
      options
    );
    const records = Array.isArray(response.data) ? response.data : (response.data?.records ?? []);
    return records[0] ?? null;
  }

  /** Export a page of results (standard pagination). */
  export(params: AbnLookupExportParams = {}, options?: RequestOptions): Promise<CompanyExportStandardResponse> {
    return this.api.company.export({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Export large sets page by page in scroll mode. */
  exportWithScroll(params: Omit<AbnLookupExportParams, "useScroll"> = {}, options?: RequestOptions): Promise<CompanyExportScrollResponse> {
    return this.api.company.exportWithScroll({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Escape hatch: the underlying master SDK client. */
  get raw(): ApiClient {
    return this.api;
  }
}

export function createAbnLookupClient(config: AbnLookupClientConfig): AbnLookupClient {
  return new AbnLookupClient(config);
}

export { ApiError } from "@companydata/companydata-sdk";
export type {
  ApiClientConfig,
  CompanyExportScrollResponse,
  CompanyExportStandardResponse,
  CompanyRecord,
  CompanySearchResponse,
  RequestOptions
} from "@companydata/companydata-sdk";
