// Minimal MCP client for the DDMarketer server.
//
// Deliberately dependency-free: the point is to show exactly what goes over
// the wire for a Streamable HTTP MCP server, so you can port it to any
// language or verify the server without installing an SDK.
//
// The server is remote and the three tools used here need no API key, so this
// runs as-is.

export const ENDPOINT = "https://www.ddmarketer.com/api/mcp";
export const PROTOCOL_VERSION = "2025-06-18";

/**
 * One JSON-RPC call against an MCP server over Streamable HTTP.
 *
 * The Accept header must list BOTH application/json and text/event-stream:
 * a Streamable HTTP server is free to answer either way, and omitting the
 * SSE type is the single most common reason a hand-rolled client gets a 406.
 */
export async function rpc(method, params = {}, { endpoint = ENDPOINT, apiKey, id = 1 } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${await res.text()}`);

  const body = await res.text();
  // A server may answer a single request as SSE. Take the last data: frame.
  const payload = body.startsWith("event:") || body.startsWith("data:")
    ? JSON.parse(body.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5))
    : JSON.parse(body);

  if (payload.error) throw new Error(`${method}: ${payload.error.message}`);
  return payload.result;
}

export const initialize = (opts) =>
  rpc("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "ddmarketer-reference-client", version: "1.0.0" },
  }, opts);

export const listTools = (opts) => rpc("tools/list", {}, opts);

export const callTool = (name, args, opts) =>
  rpc("tools/call", { name, arguments: args }, opts);

/** Structured payload if the server sent one, else the text block. */
export function unwrap(result) {
  if (result?.structuredContent) return result.structuredContent;
  return result?.content?.find((c) => c.type === "text")?.text ?? result;
}
