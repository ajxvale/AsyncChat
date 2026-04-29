import { blob } from "https://esm.town/v/std/blob";

const MESSAGES_KEY = "async_chat_messages";
const USERS_KEY = "async_chat_users";

const TOOLS = [
  {
    name: "read_messages",
    description: "Read recent messages from the async chat. Returns the last N messages (default 20).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of recent messages to return (default 20, max 100)" },
      },
    },
  },
  {
    name: "send_message",
    description: "Send a message to the async chat as a specific user.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string", description: "The name to send the message as" },
        text: { type: "string", description: "The message text to send" },
      },
      required: ["user", "text"],
    },
  },
  {
    name: "list_users",
    description: "List all registered users in the async chat.",
    inputSchema: { type: "object", properties: {} },
  },
];

async function handleTool(name: string, args: any): Promise<string> {
  if (name === "read_messages") {
    const limit = Math.min(args?.limit || 20, 100);
    const messages = ((await blob.getJSON(MESSAGES_KEY).catch(() => null)) ?? []) as any[];
    const recent = messages.slice(-limit);
    if (recent.length === 0) return "No messages yet.";
    return recent.map((m: any) => {
      const time = new Date(m.ts).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
      return "[" + time + "] " + m.user + ": " + m.text;
    }).join("\n");
  }

  if (name === "send_message") {
    if (!args?.user || !args?.text) return "Error: user and text are required.";
    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      user: args.user,
      text: args.text,
      ts: Date.now(),
    };
    const existing = ((await blob.getJSON(MESSAGES_KEY).catch(() => null)) ?? []) as any[];
    existing.push(msg);
    await blob.setJSON(MESSAGES_KEY, existing.slice(-500));
    const users = ((await blob.getJSON(USERS_KEY).catch(() => null)) ?? {}) as any;
    if (!users[args.user] && Object.keys(users).length < 4) {
      const colors = ["#7C3AED", "#2D5A3D", "#0E7490", "#C2410C"];
      const taken = Object.values(users).map((u: any) => u.color);
      const pick = colors.find((c) => !taken.includes(c)) || colors[0];
      users[args.user] = { color: pick };
      await blob.setJSON(USERS_KEY, users);
    }
    return "Message sent as " + args.user + ": " + args.text;
  }

  if (name === "list_users") {
    const users = ((await blob.getJSON(USERS_KEY).catch(() => null)) ?? {}) as any;
    const names = Object.keys(users);
    if (names.length === 0) return "No users registered yet.";
    return "Registered users: " + names.join(", ");
  }

  return "Unknown tool: " + name;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function extractToken(req: Request): string {
  const auth = req.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  if (auth.toLowerCase().startsWith("basic ")) return auth.slice(6).trim();
  if (auth) return auth.trim();
  return "";
}

function isAuthed(req: Request): boolean {
  const expected = Deno.env.get("CHAT_PASSWORD") || "changeme";
  return extractToken(req) === expected;
}

export default async function (req: Request): Promise<Response> {
  // Always allow CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ── Auth gate: reject with proper WWW-Authenticate header ──
  if (!isAuthed(req)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  // ── GET: token verification (LeChat checks this returns 200 with valid token) ──
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", server: "async-chat-mcp", version: "1.0.0" }),
      {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  // ── POST: Streamable HTTP MCP (JSON-RPC) ──
  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const { id, method, params } = body;

    // Notifications — no response body needed
    if (method === "initialized" || method === "notifications/initialized") {
      return new Response(null, { status: 202, headers: CORS });
    }

    let result: any;

    if (method === "initialize") {
      result = {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "async-chat-mcp", version: "1.0.0" },
      };
    } else if (method === "ping") {
      result = {};
    } else if (method === "tools/list") {
      result = { tools: TOOLS };
    } else if (method === "tools/call") {
      const text = await handleTool(params?.name, params?.arguments || {});
      result = { content: [{ type: "text", text }] };
    } else {
      return Response.json(
        { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: " + method } },
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    return Response.json(
      { jsonrpc: "2.0", id, result },
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  return Response.json({ error: "Not found" }, { status: 404, headers: CORS });
}
