# Australian Business Register API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/abn-lookup-api.svg)](https://www.npmjs.com/package/@companydata/abn-lookup-api)

A small, typed TypeScript wrapper for **Australian Business Register company data**: names, full street addresses, contacts, directors and more, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). Same API, same key, with the country pinned to AU and a register-specific helper on top, so you can write `client.getByAbn("...")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving between countries is a one-line change.

## What is it?

ABN Lookup, run by the ATO, validates ABNs and returns trade names well, but it gives only the state and postcode of a business, with no street, phone, email or directors.

**CompanyData adds the missing fields.** Full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/abn-lookup-api](https://companydata.com/abn-lookup-api/). Official register: [abr.business.gov.au](https://abr.business.gov.au).

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

// Look up one business by its ABN.
const company = await client.getByAbn("51824753556");

// Search with filters (country is always AU here).
const page = await client.search({ cityName: "Sydney", hasEmail: true, pageSize: 25 });
console.log(page.data);
```

## Methods

| Method | Does |
| --- | --- |
| `client.search(params)` | Search businesses with filters. |
| `client.getByAbn(id)` | Fetch one business by its ABN, or `null`. |
| `client.export(params)` | Export a page of results (standard pagination). |
| `client.exportWithScroll(params)` | Export large sets page by page. |
| `client.raw` | The underlying master SDK client. |

## Four ways to integrate

1. **This register SDK** (`@companydata/abn-lookup-api`) you are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)) all 200+ countries, keyed by `countryCode`.
3. **MCP server** connect an AI agent to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST** `GET https://companydata.com/api/company/search?countryCode=AU&...`. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

## Related register wrappers

Same pattern, one per official register. See the [CompanyData GitHub org](https://github.com/companydatacom) for the full list.

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
