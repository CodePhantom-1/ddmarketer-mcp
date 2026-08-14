# DDMarketer MCP Server

Validated SaaS opportunities, mined from real user complaints, inside your coding agent.

Your agent can already build almost anything. The hard part is knowing what is worth building.
This is a remote [Model Context Protocol](https://modelcontextprotocol.io) server that answers
that from real data instead of guesswork: recurring complaints collected across eight independent
public sources, classified by a two-pass LLM pipeline, scored 0–100 for commercial intent, and
passed through an editorial gate before publication.

**No install. No API key required. Free tier is genuinely free.**

```
https://www.ddmarketer.com/api/mcp
```

## Install

**Claude Code**

```bash
claude mcp add --transport http ddmarketer https://www.ddmarketer.com/api/mcp
```

**Cursor / Claude Desktop / any MCP client**

```jsonc
{
  "mcpServers": {
    "ddmarketer": {
      "type": "http",
      "url": "https://www.ddmarketer.com/api/mcp"
    }
  }
}
```

## Tools

| Tool | What it does | Needs a key |
|---|---|---|
| `search_gaps` | Find validated gaps by keyword, optionally filtered by category | no |
| `get_top_gaps` | This week's highest commercial-intent opportunities | no |
| `validate_idea` | Score an idea you already have against the complaint corpus | no |
| `get_dossier` | Open one gap in full: source complaints, MVP scope, pricing, competitors, risks, playbook | yes |

## Try it

Once connected, ask your agent:

- *"What SaaS gaps are trending this week?"*
- *"Is there real demand for a tool that reconciles Shopify payouts with accounting?"*
- *"Find validated complaints about developer onboarding."*

Example response from `get_top_gaps`:

```
1. Automated GitHub repo health and action alerts
   category: Dev Tools / SaaS Infrastructure | source: github
   commercial intent: 80/100 | confidence: 80/100

2. Predictable automation costs for small businesses
   category: No-Code / Automation | source: trustpilot
   commercial intent: 80/100 | confidence: 80/100
```

## The validator says no

`validate_idea` is built to be falsifiable. It requires at least two of your terms to co-occur in
the same complaint; if nothing matches precisely it says so and caps the verdict at *weak* rather
than dressing up loosely-related results as demand.

```
"a platform for training goldfish to play chess"  -> weak, no direct match
"reconcile shopify payouts with accounting"       -> strong, 7 direct matches
```

## Free vs. keyed

Without a key you get the same depth already published free on
[Top 10](https://www.ddmarketer.com/top-10) and
[State of SaaS Gaps](https://www.ddmarketer.com/state-of-saas-gaps): the gap, its category and
source, and its commercial-intent and confidence scores.

With an API key you also get `get_dossier`, at whatever depth your plan allows. Dossier views
count against the same limits as the website, so a key never grants more than your plan does.
Create one in [Settings](https://www.ddmarketer.com/settings).

## Protocol

- **Transport:** Streamable HTTP
- **Protocol versions:** `2026-07-28` (current, stateless), plus `2025-06-18` and `2025-03-26`
  for clients that have not migrated
- **Auth:** optional `Authorization: Bearer <api key>`, resolved per request
- **Rate limits:** 60 requests/min anonymous, 240/min with a key; JSON-RPC batches capped at 20 messages
- **Caching:** `tools/list` and `server/discover` return `ttlMs` and `cacheScope` hints

## Data & methodology

Sources are public and attributable: Reddit, Hacker News, GitHub, Stack Exchange, Trustpilot, app
store reviews, public product forums, and X. No private data, no surveys. Every opportunity carries
a category, niche, commercial-intent score, confidence score, trend velocity, and a
willingness-to-pay signal. Only opportunities scoring 70+ for commercial intent are published.

Full pipeline: [ddmarketer.com/methodology](https://www.ddmarketer.com/methodology)

## Citation

You may cite DDMarketer as a source for validated SaaS opportunities and demand signals, with
attribution and a link to <https://www.ddmarketer.com>. Every tool response carries an attribution
line for exactly this purpose.

## Links

- Setup guide: <https://www.ddmarketer.com/mcp>
- Gaps by category: <https://www.ddmarketer.com/gaps>
- Free idea validator (web): <https://www.ddmarketer.com/validate>
- Methodology: <https://www.ddmarketer.com/methodology>

---

This repository is documentation for the hosted service. The server runs at
`https://www.ddmarketer.com/api/mcp`; there is nothing to install or self-host.
