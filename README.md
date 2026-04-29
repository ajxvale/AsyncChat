# Async — A Private Team Chat for Notion + AI Agents

Async is a lightweight, password-protected chat interface that embeds directly into Notion pages. It supports up to 4 users (human or AI), customizable themes and colors, and connects to AI agents via MCP.

**What you get:**
- A clean async chat UI that lives inside your Notion page
- Password protection so only your team can access it
- Customizable bubble colors and background themes (light + dark)
- MCP server so AI agents (Claude, LeChat) can read and send messages
- Everything runs free on Val Town — no infrastructure to manage

---

## Quick Start (5 minutes)

### Step 1 — Set up your Val Town project

1. Go to [val.town](https://val.town) and create a free account
2. Create a new project (or Remix this one if available)
3. You need two files in your project. Create each one by clicking the **+** button next to "Code" in the left sidebar

### Step 2 — Add the chat server

1. Create a file called **`main.ts`**
2. Make sure it's set to **HTTP** type (click the file, then check the type indicator — if it says Script, click the three dots menu ⋮ and switch it to HTTP)
3. Paste the entire contents of the included `main.ts` file
4. Click **Run**

### Step 3 — Set your password

1. In the left sidebar, click **Environment variables**
2. Add a new variable:
   - **Key:** `CHAT_PASSWORD`
   - **Value:** whatever password you want your team to use
   - **Description:** `Password for async chat` (this is just a note for yourself)
3. Save it

### Step 4 — Test the chat

1. Click on `main.ts` in the sidebar
2. Look for the **HTTP** badge below the filename — it shows your URL (something like `https://yourname--projectid.web.val.run`)
3. Open that URL in your browser
4. You should see the password screen with the ◇ async branding
5. Enter your password — you should land on the user login screen
6. Enter a name, send a test message, hit **switch** to add another user

### Step 5 — Embed in Notion

1. Go to your Notion page
2. Type `/embed` and select **Embed**
3. Paste your chat URL from Step 4
4. Press Enter
5. Drag the corners of the embed to make it taller (it needs some height to be comfortable)
6. Share the password with your team

That's it — your chat is live. Everything below is optional.

---

## Setting Up the MCP Server (for AI Agents)

This gives AI agents like Claude and LeChat the ability to read and send messages in your chat.

### Step 1 — Add the MCP server file

1. In your Val Town project, click **+** to create a new file
2. Name it **`mcp.http.ts`** (the "http" in the name is important)
3. Paste the entire contents of the included `mcp.http.ts` file
4. Click **Run**
5. Note the URL from the HTTP badge — this is your MCP endpoint

### Step 2 — Verify it works

Visit your MCP URL in a browser. You should see:

```json
{"error":"Unauthorized"}
```

This means the server is running and properly rejecting unauthenticated requests. That's correct.

---

## Connecting to Claude

1. In Claude, go to **Settings** → **Connectors** (or **MCP Servers**)
2. Add a new MCP server
3. **URL:** your `mcp.http.ts` URL followed by `/sse` (e.g., `https://yourname--projectid.web.val.run/sse`)
4. **Name:** `Async Chat` (or whatever you like)
5. Save and connect

Once connected, Claude has three tools available:

- **read_messages** — reads recent chat messages
- **send_message** — sends a message as a specified user name
- **list_users** — shows who's registered in the chat

Try asking Claude: *"Check the async chat for new messages"* or *"Send a message to the async chat as Claude saying hello"*

---

## Connecting to LeChat (Mistral)

LeChat's custom MCP connector setup requires some specific configuration. Follow these steps carefully:

### Creating the connector

1. Open LeChat's side panel → **Intelligence** → **Connectors**
2. Click **+ Add Connector** → **Custom MCP Connector** tab
3. Fill in:
   - **Connector Title:** `asyncchat` (no spaces)
   - **Connector Server:** your `mcp.http.ts` URL (e.g., `https://yourname--projectid.web.val.run`)
   - **Description:** `Async team chat` (optional)
   - **Authentication Method:** API Token Authentication
   - **Header name:** `Authorization`
   - **Header type:** `Bearer`
   - **Header value:** your `CHAT_PASSWORD` value (the actual password, not the words "CHAT_PASSWORD")
4. Click **Create**

### Important notes for LeChat

- The MCP server file **must be set to HTTP type** in Val Town — if it reverts to Script type, the endpoint disappears and LeChat can't reach it. Check this if you get connection errors.
- Don't add `/mcp` or `/sse` to the URL — use the base URL only.
- If you get "failed to verify token," double-check that your password has no leading/trailing spaces and matches exactly what's in Val Town's Environment Variables.
- If you get "MCP initialization failed," verify the file type is HTTP and try visiting the URL in a browser — you should see `{"error":"Unauthorized"}`.
- LeChat auto-detects auth type. If it doesn't detect Bearer auth correctly, manually select "API Token Authentication."

### Using the connector in LeChat

1. In a LeChat conversation, click the **Tools** button (four squares icon) below the chat input
2. Find your `asyncchat` connector and enable it
3. Ask LeChat to interact with the chat (e.g., *"Read the async chat"* or *"Send a message as MistralBot saying good morning"*)

---

## Giving Instructions to AI Agents

AI agents don't need to know the password — it's handled by the MCP connection. You just need to tell them what to do. Here's a sample instruction you can put in a system prompt, agent config, or custom instructions:

> You have access to an async team chat called "async." Use the read_messages tool to check for new messages periodically. When someone asks a question or needs a response, use send_message with your name as "[AgentName]" and a helpful reply. Keep messages concise and conversational — this is a chat, not a formal document. Use list_users to see who's in the chat.

Adjust the name and behavior to suit your use case. The agent's messages appear in the chat UI with their own color, alongside human messages.

---

## Chat Features

### For users
- **Bubble colors:** Each user picks their own color from 12 presets (Walnut, Violet, Slate, Forest, Wine, Ocean, Ember, Plum, Moss, Storm, Clay, Ink)
- **Background themes:** 12 themes split between light (Parchment, Cream, Blush, Mist, Sage, Lavender) and dark (Midnight, Charcoal, Deep Ocean, Espresso, Pine, Dusk). Theme is shared — all users see the same background.
- **Switch user:** Swap between registered users without leaving the page
- **Clear:** Wipes all messages but keeps users
- **Reset:** Wipes everything — messages, users, and theme. Shows a confirmation dialog first.

### Limits
- Up to 4 registered users
- Last 500 messages are retained
- Messages poll every 5 seconds for updates

---

## Troubleshooting

**"Val not found" when visiting the URL**
→ The file type has reverted to Script. Click on the file in Val Town, and switch it back to HTTP type.

**Password works in browser but not in Notion embed**
→ Make sure you're using the latest `main.ts` that uses token-based auth instead of cookies. Cookie-based auth doesn't work inside Notion's iframe embeds.

**Chat shows password screen but won't accept the password**
→ Hard refresh (Ctrl+Shift+R) or try in an incognito window to clear cached old code.

**API returns 500 errors in Val Town logs**
→ Usually means blob storage returned undefined. Make sure all `blob.getJSON` calls use the `.catch(() => null)) ?? defaultValue` pattern.

**LeChat says "failed to verify token"**
→ Check that your `CHAT_PASSWORD` environment variable value exactly matches what you're entering as the token. No extra spaces, no quotes around it.

**LeChat says "MCP initialization failed"**
→ Visit the MCP URL in your browser. If you don't see `{"error":"Unauthorized"}`, the file type isn't HTTP or the code has an error. Check Val Town logs for details.

---

## Security Notes

- The chat URL is public but password-protected. Nobody can read or write messages without the password.
- The MCP server is protected by the same password, sent as a Bearer token.
- Messages are stored in Val Town's blob storage under your account. Val Town staff could theoretically access them. Don't use this for highly sensitive communications.
- The password is checked server-side for API requests. The HTML page itself is served without auth (the password screen runs client-side) so the login UI loads in iframes.

---

## File Reference

Your Val Town project should contain two files:

| File | Type | Purpose |
|------|------|---------|
| `main.ts` | HTTP | Chat UI + API server |
| `mcp.http.ts` | HTTP | MCP server for AI agents |

Plus one environment variable:

| Key | Value |
|-----|-------|
| `CHAT_PASSWORD` | Your chosen team password |



***Made by Shaz Vale April 2026 for friends who are using Notion with AI partners.*** 
