import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";

const SKIP = /(^|\/)\.(obsidian|trash|git)(\/|$)/;

export async function listNotes(root) {
    const all = await fs.readdir(root, { recursive: true });
    return all.map((p) => p.split(path.sep).join("/"))
        .filter((p) => p.endsWith(".md") && !SKIP.test(p));
}

export const hashOf = (s) => crypto.createHash("sha1").update(s).digest("hex");

const LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
const TAG = /(?:^|\s)#([\p{L}\p{N}_\/-]+)/gu;

export function parseNote(rel, raw) {
    const { data, content } = matter(raw);
    const title = path.basename(rel, ".md");
    const links = [...content.matchAll(LINK)].map((m) => m[1].trim());
    const fmTags = [].concat(data.tags ?? []).map(String);
    const tags = [...new Set([...fmTags, ...[...content.matchAll(TAG)].map((m) => m[1])])];
    return { path: rel, title, frontmatter: data, links, tags, chunks: chunk(title, content) };
}

const MAX = 1500; // characters per chunk, tune later

function chunk(title, body) {
    const out = [];
    let heading = "", buf = [], inFence = false;
    const flush = () => {
        const t = buf.join("\n").trim();
        if (t) for (const piece of split(t)) out.push({ heading, text: piece });
        buf = [];
    };
    for (const line of body.split("\n")) {
        if (line.startsWith("```")) inFence = !inFence;
        const h = !inFence && line.match(/^(#{1,6})\s+(.*)/);
        if (h) { flush(); heading = h[2].trim(); continue; }
        buf.push(line);
    }
    flush();
    // Prefix context so a chunk still makes sense on its own
    return out.map((c, i) => ({ ...c, idx: i, embedText: `${title}${c.heading ? " > " + c.heading : ""}\n\n${c.text}` }));
}

function split(text) {
    if (text.length <= MAX) return [text];
    const parts = [], paras = text.split(/\n\s*\n/);
    let cur = "";
    for (const p of paras) {
        if (cur && cur.length + p.length > MAX) { parts.push(cur); cur = ""; }
        cur += (cur ? "\n\n" : "") + p;
    }
    if (cur) parts.push(cur);
    return parts;
}