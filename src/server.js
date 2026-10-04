import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PORT } from "./config.js";
import { readNote } from "./vault.js";
import { embedQuery } from "./embed.js";
import { search } from "./store.js";


const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ ...text(t), isError: true });

function buildServer() {
    const server = new McpServer({ name: "vault", version: "0.1.0" });

    //Getting the note from a vault
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

    //Search vault with what to look for
    server.registerTool("search_vault", {
        description:
            "Semantic search over the user's Obsidian notes. Use it when the user asks about " +
            "something they may have written down. Returns matching sections with their note " +
            "path; call get_note on a path to read the whole note.",
        inputSchema: {
            query: z.string().describe("What to look for, in natural language"),
            limit: z.number().int().min(1).max(20).default(5),
            folder: z.string().optional().describe("Restrict to a vault folder, e.g. 'Projects'"),
        },
        annotations: { readOnlyHint: true },
    }, async ({ query, limit, folder }) => {
        const hits = await search(await embedQuery(query), { limit: limit * 3, folder });
        // Keep the best chunk per note so one long note can't fill every slot
        const seen = new Set(), best = [];
        for (const h of hits) {
            if (seen.has(h.path)) continue;
            seen.add(h.path); best.push(h);
            if (best.length === limit) break;
        }
        if (!best.length) return text("No matching notes.");
        return text(best.map((h, i) =>
            `${i + 1}. ${h.path}${h.heading ? " > " + h.heading : ""} (score ${(1 - h._distance).toFixed(2)})\n` +
            h.text.slice(0, 300).replace(/\s+/g, " ")
        ).join("\n\n"));
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