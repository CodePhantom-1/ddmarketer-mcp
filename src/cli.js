#!/usr/bin/env node
// Runs the DDMarketer MCP server end to end and prints what comes back.
//
//   node src/cli.js                       # handshake + the three open tools
//   node src/cli.js "shopify accounting"  # search a specific market
//
// No API key needed. Set DDMARKETER_API_KEY to also exercise get_dossier.
import { initialize, listTools, callTool, unwrap } from "./client.js";

const query = process.argv[2] ?? "shopify accounting";
const apiKey = process.env.DDMARKETER_API_KEY;
const opts = { apiKey };

const line = (s) => console.log(`\n== ${s}`);

const init = await initialize(opts);
line("handshake");
console.log(`  ${init.serverInfo.name} v${init.serverInfo.version}  protocol ${init.protocolVersion}`);

const { tools } = await listTools(opts);
line(`tools (${tools.length})`);
for (const t of tools) console.log(`  ${t.name.padEnd(14)} ${t.description.split(". ")[0]}.`);

line(`search_gaps "${query}"`);
for (const g of unwrap(await callTool("search_gaps", { query, limit: 3 }, opts)).gaps ?? []) {
  console.log(`  [${String(g.commercialIntent).padStart(3)}/${g.confidence}] ${g.title}`);
  console.log(`        ${g.url}`);
}

line("get_top_gaps");
for (const g of unwrap(await callTool("get_top_gaps", { limit: 3 }, opts)).gaps ?? []) {
  console.log(`  [${String(g.commercialIntent).padStart(3)}/${g.confidence}] ${g.title}`);
}

line('validate_idea "a tool that reconciles Shopify payouts with accounting software"');
const v = unwrap(await callTool("validate_idea",
  { idea: "a tool that reconciles Shopify payouts with accounting software" }, opts));
console.log(`  verdict     ${v.verdict.level} - ${v.verdict.headline}`);
// matchCount counts LOOSELY related complaints when the verdict is weak, so
// reading it without the verdict overstates the evidence.
console.log(`  matchCount  ${v.matchCount}  (read with verdict.level, not alone)`);
console.log(`  ${v.verdict.detail}`);

if (apiKey) {
  line("get_dossier (API key present)");
  const first = unwrap(await callTool("search_gaps", { query, limit: 1 }, opts)).gaps?.[0];
  if (first) {
    const d = unwrap(await callTool("get_dossier", { id: first.id }, opts));
    console.log(`  keys: ${Object.keys(d).join(", ")}`);
  }
} else {
  line("get_dossier");
  console.log("  skipped - set DDMARKETER_API_KEY to run it. Each call consumes plan quota.");
}
