# Australian Business Register API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/abn-lookup-api.svg)](https://www.npmjs.com/package/@companydata/abn-lookup-api)

A small, typed TypeScript wrapper for looking up **Australian company data from the Australian Business Register (ABN Lookup)**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to Australia and a register-specific helper on top, so you can write `client.getByAbn("48 123 123 124")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from ABR to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇦🇺 Australia (`countryCode: "AU"`) |
| Register | Australian Business Register (ABN Lookup) |
| Businesses in CompanyData | 8.57M |
| With phone number | 1.18M |
| With email address | 746K |
| Lookup key | ABN or ACN (11 digits (ABN) or 9 digits (ACN)) |
| Verified example | Commonwealth Bank of Australia, `48 123 123 124` |
| Live demo and comparison | [companydata.com/abn-lookup-api](https://companydata.com/abn-lookup-api/) |
| Official register | [abr.business.gov.au](https://abr.business.gov.au) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is ABN Lookup?

The **Australian Business Register** (ABR) is run by the Australian Taxation Office, and **ABN Lookup** at [abr.business.gov.au](https://abr.business.gov.au) is its public face. Its free web service confirms an ABN or ACN, the entity type, GST registration and the business names attached to it.

What the official ABN Lookup web service does **not** give you: no street address (only state and postcode), no phone number, no email address, no website, no employee or revenue figures, and no way to pull a segment by city or industry.

**CompanyData adds the missing fields.** 8.57M Australian businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/abn-lookup-api](https://companydata.com/abn-lookup-api/).

## Installation

```bash
npm install @companydata/abn-lookup-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { AbnLookupClient } from "@companydata/abn-lookup-api";

const client = new AbnLookupClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its ABN or ACN.
const company = await client.getByAbn("48 123 123 124"); // Commonwealth Bank of Australia

// Search with filters (country is always AU here).
const page = await client.search({
  cityName: "SYDNEY",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "SYDNEY"`, not `"Sydney"` (which returns 0). The same goes for `provinceName: "VICTORIA"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/abn-lookup-api && cd abn-lookup-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Commonwealth Bank of Australia as returned by `getByAbn`:

```json
{
  "Company Name": "Telstra Group LIMITED",
  "Trade Name": null,
  "Company Registration Number": "650620303",
  "Address 1": "L 41 242 Exhibition St",
  "Postal Code": "3000",
  "City": "Melbourne",
  "State/Province": "Victoria",
  "Country": "Australia",
  "Phone Number": "+6*****39",
  "Email": null,
  "Website": "telstra.*****",
  "Founding Year": 2021,
  "Employees Total": 23274,
  "Yearly Revenue in U.S. Dollars": 15006806875,
  "Business Category Code 1 - Description": "Telephone Communications, Except Radiotelephone",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `AbnLookupPage` | Search Australian businesses with filters. |
| `client.getByAbn(id, scope?)` | `CompanyRecord \| null` | Fetch one business by ABN or ACN. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `AbnLookupPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `AbnLookupScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeAbnLookupId(id)` | `string` | The ABN or ACN normalisation the lookup helper applies. |

```ts
interface AbnLookupPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface AbnLookupScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"AU"` here. For cross-border queries, use the master SDK directly.

### Lookup by ABN or ACN

`getByAbn` takes an 11-digit ABN or a 9-digit ACN, whichever the record carries. Spaces are stripped, so `"48 123 123 124"` and `"48123123124"` match the same company. Most records store the ABN; some older company records store the ACN instead, see Known limitations.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Telstra",
  cityName: "MELBOURNE",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "VICTORIA",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "SYDNEY", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "SYDNEY", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "SYDNEY", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Telstra"` | Free text over company and trade names. |
| `nationalId` | `"48123123124"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"SYDNEY"` | UPPER CASE. |
| `provinceName` | `"VICTORIA"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"3000"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Known limitations

- A company can be stored under its ABN or its ACN depending on the source. If an ABN returns `null`, try the ACN (the last 9 digits of the ABN) or `search` by name.

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/abn-lookup-api`): Australian lookups with a ABR-specific helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=AU&cityName=SYDNEY` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=AU&nationalId=48123123124&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/abn-lookup-api";

try {
  await client.search({ cityName: "SYDNEY" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
