import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PORT } from "./config.js";
import { readNote } from "./vault.js";

const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ ...text(t), isError: true });

function buildServer() {
    const server = new McpServer({ name: "vault", version: "0.1.0" });

    server.registerTool("get_note", {
        description: "Read one Obsidian note by its vault-relative path, e.g. 'Projects/Idea.md'.",
        inputSchema: { path: z.string().describe("Vault-relative path ending in .md") },
        annotations: { readOnlyHint: true },
    }, async ({ path }) => {
        try {
            const n = await readNote(path);
            return text(`# ${n.path}\n\nFrontmatter: ${JSON.stringify(n.frontmatter)}\n\n${n.content}`);
        } catch (e) {
            return fail(`Could not read ${path}: ${e.message}`);
        }
    });

    return server;
}

const app = express();
app.use(express.json({ limit: "2mb" }));

// Reject browser pages from other origins (DNS-rebinding protection)
app.use((req, res, next) => {
    const o = req.headers.origin;
    if (o && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return res.status(403).end();
    next();
});

app.post("/mcp", async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, "127.0.0.1", () => console.error(`vault MCP on :${PORT}/mcp`));