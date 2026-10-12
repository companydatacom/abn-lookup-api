/** Run: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts */
import { AbnLookupClient } from "../src/index";

const client = new AbnLookupClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });

const company = await client.getByAbn("51824753556");
console.log("By ABN:", company);

const page = await client.search({ cityName: "Sydney", hasEmail: true, pageSize: 25 });
console.log("Search:", page.data);
