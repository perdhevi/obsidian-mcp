# vault-mcp

An MCP server that lets AI clients search and read an Obsidian vault, and save new notes into an inbox folder. It runs locally as a single Node daemon over Streamable HTTP, so Claude Code, Claude Desktop and Hermes Agent can all share one index.

Built by hand, step by step, to learn how MCP, embeddings and vector search fit together. The full walkthrough is in [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md).

## Tools

| Tool | What it does |
| --- | --- |
| `search_vault` | Semantic search over note sections, with an optional folder filter |
| `get_note` | Read one note's text and frontmatter |
| `get_backlinks` | List notes that link to a given note |
| `create_note` | Create a new note in the inbox folder (never edits or overwrites) |

## How it works

- Notes are split into sections by heading and embedded locally with Ollama (`nomic-embed-text`).
- Vectors live in LanceDB, an embedded database; the wikilink graph is kept in memory.
- A file watcher re-indexes notes as you edit them, and a startup check catches changes made while the server was off.
- All writes to the index go through one queue, so the watcher and the tools never conflict.

## Requirements

- Node.js 20+
- [Ollama](https://ollama.com) with `ollama pull nomic-embed-text`
- Windows, macOS or Linux

## Quick start

```bash
npm install
```

Create `.env` in the project root:

```bash
VAULT_PATH=/absolute/path/to/your/vault
INBOX_DIR=Inbox
OLLAMA_URL=http://127.0.0.1:11434
DB_PATH=./data/lancedb
PORT=3000
```

On Windows, use forward slashes: `VAULT_PATH=C:/Users/you/vault`.

Start the server:

```bash
node --env-file=.env src/server.js
```

The first start embeds the whole vault, which can take a while; later starts only re-embed changed notes.

## Connect a client

The endpoint is `http://127.0.0.1:3000/mcp`.

- **Claude Code:** `claude mcp add --transport http vault http://127.0.0.1:3000/mcp`
- **Claude Desktop:** add to `claude_desktop_config.json`:
  ```json
  { "mcpServers": { "vault": { "command": "npx", "args": ["-y", "mcp-remote", "http://127.0.0.1:3000/mcp"] } } }
  ```
- **Hermes Agent:** in `~/.hermes/config.yaml`:
  ```yaml
  mcp_servers:
    vault:
      url: "http://127.0.0.1:3000/mcp"
  ```
- **Testing:** `npx @modelcontextprotocol/inspector`, transport Streamable HTTP.

To keep it running in the background, see Step 10 of the build guide.

## Safety

- Binds to `127.0.0.1` only and rejects browser requests from other origins.
- File paths from clients are checked so nothing outside the vault can be read or written.
- `create_note` writes only new files into the inbox folder.
- Frontmatter is parsed with `yaml` instead of `gray-matter`, avoiding CVE-2026-78847 (code execution via `---js` frontmatter).

Don't expose the server beyond localhost without adding authentication and HTTPS.
