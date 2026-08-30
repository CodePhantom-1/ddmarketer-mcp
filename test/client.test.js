import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { unwrap, rpc, ENDPOINT, PROTOCOL_VERSION } from "../src/client.js";

describe("unwrap", () => {
  test("prefers structuredContent", () => {
    assert.deepEqual(unwrap({ structuredContent: { gaps: [1] }, content: [{ type: "text", text: "x" }] }), { gaps: [1] });
  });

  test("falls back to the text block", () => {
    assert.equal(unwrap({ content: [{ type: "text", text: "hello" }] }), "hello");
  });

  test("does not throw on an unexpected shape", () => {
    assert.doesNotThrow(() => unwrap({}));
    assert.doesNotThrow(() => unwrap(null));
  });
});

describe("rpc transport", () => {
  test("sends both JSON and SSE in Accept", async () => {
    // A Streamable HTTP server may answer either way. Omitting text/event-stream
    // is the most common reason a hand-rolled MCP client gets a 406.
    let seen;
    const orig = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      seen = init.headers;
      return { ok: true, text: async () => JSON.stringify({ jsonrpc: "2.0", id: 1, result: { ok: true } }) };
    };
    try {
      await rpc("ping");
      assert.match(seen.Accept, /application\/json/);
      assert.match(seen.Accept, /text\/event-stream/);
    } finally { globalThis.fetch = orig; }
  });

  test("parses an SSE-framed response", async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"from":"sse"}}\n\n',
    });
    try {
      assert.deepEqual(await rpc("ping"), { from: "sse" });
    } finally { globalThis.fetch = orig; }
  });

  test("surfaces a JSON-RPC error rather than returning undefined", async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: "needs an API key" } }),
    });
    try {
      await assert.rejects(() => rpc("tools/call"), /needs an API key/);
    } finally { globalThis.fetch = orig; }
  });

  test("only sends Authorization when a key is given", async () => {
    const seen = [];
    const orig = globalThis.fetch;
    globalThis.fetch = async (_u, init) => {
      seen.push(init.headers.Authorization);
      return { ok: true, text: async () => JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }) };
    };
    try {
      await rpc("ping");
      await rpc("ping", {}, { apiKey: "k" });
      assert.equal(seen[0], undefined);
      assert.equal(seen[1], "Bearer k");
    } finally { globalThis.fetch = orig; }
  });
});

describe("constants", () => {
  test("endpoint is the hosted server over https", () => {
    assert.match(ENDPOINT, /^https:\/\/www\.ddmarketer\.com\/api\/mcp$/);
  });
  test("protocol version is a dated MCP revision", () => {
    assert.match(PROTOCOL_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  });
});

// Opt-in: hits the real server. Skipped by default so `npm test` stays offline
// and deterministic in CI.
describe("live server", { skip: !process.env.LIVE }, () => {
  test("initialize returns serverInfo", async () => {
    const r = await rpc("initialize", {
      protocolVersion: PROTOCOL_VERSION, capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    });
    assert.ok(r.serverInfo.name);
  });
});
