import fs from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.js"
import { VAULT, INBOX } from "./config.js";

// Paths inside the program: vault-relative, forward slashes, on every OS
export const normRel = (p) =>
    String(p).trim().replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/\/{2,}/g, "/");

// Stored path -> real OS path, refusing anything outside the vault
export function resolveInVault(rel) {
    const abs = path.resolve(VAULT, ...normRel(rel).split("/"));
    const inside = path.relative(VAULT, abs);
    if (inside === ".." || inside.startsWith(".." + path.sep) || path.isAbsolute(inside))
        throw new Error("Path outside vault");
    return abs;
}

// Real OS path (from fs or the watcher) -> stored path
export const toRel = (abs) => path.relative(VAULT, abs).split(path.sep).join("/");

export async function readNote(rel) {
    const r = normRel(rel);
    const raw = await fs.readFile(resolveInVault(r), "utf8");
    const { data, content } = parseFrontmatter(raw);
    return { path: r, frontmatter: data, content };
}

// Names Windows reserves for devices, even with an extension (CON.md is invalid)
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

// A title -> a file name that is valid on Windows, macOS and Linux, and safe in Obsidian links
const safeName = (t) => {
    let name = String(t)
        .replace(/[\x00-\x1F\x7F]/g, " ")    // control chars, including newlines and tabs
        .replace(/[\\/:*?"<>|#^[\]]/g, "")   // Windows-illegal, path separators, link-breaking
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+/, "")                 // leading dots: hidden on macOS/Linux and in Obsidian
        .slice(0, 100)
        .trim();
    if (RESERVED.test(name)) name += "_";  // CON -> CON_
    return name;
};

export async function createInboxNote(title, body, tags = []) {
    const name = safeName(title);
    if (!name) throw new Error("Title is empty after removing invalid characters");
    const dir = resolveInVault(INBOX);
    await fs.mkdir(dir, { recursive: true });
    const abs = resolveInVault(`${INBOX}/${name}.md`);
    const fm = stringifyFrontmatter(body, { created: new Date().toISOString(), source: "mcp", tags });
    await fs.writeFile(abs, fm, { flag: "wx" }); // throws EEXIST instead of overwriting
    return toRel(abs);
}