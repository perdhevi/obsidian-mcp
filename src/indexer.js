import fs from "node:fs/promises";
import { VAULT } from "./config.js";
import { listNotes, parseNote, hashOf } from "./parse.js";
import { embedDocs } from "./embed.js";
import { replaceNote, removeNote } from "./store.js";
import { setLinks, dropNote } from "./links.js";

export async function indexFile(rel) {
    const abs = `${VAULT}/${rel}`;
    const [raw, stat] = await Promise.all([fs.readFile(abs, "utf8"), fs.stat(abs)]);
    const note = parseNote(rel, raw);
    const vectors = note.chunks.length ? await embedDocs(note.chunks.map((c) => c.embedText)) : [];
    const rows = note.chunks.map((c, i) => ({
        id: `${rel}#${c.idx}`, path: rel, heading: c.heading, text: c.text, vector: vectors[i],
    }));
    await replaceNote({ path: rel, hash: hashOf(raw), mtime: stat.mtimeMs }, rows);
    setLinks(rel, note.links)
    return note;
}


export async function removeFile(rel) {
    await removeNote(rel);
    dropNote(rel);
}

export async function fullReindex() {
    const files = await listNotes(VAULT);
    for (const rel of files) { await indexFile(rel); console.error("indexed", rel); }
    return files.length;
}

export async function loadAllLinks() {
    const files = await listNotes(VAULT);
    for (const rel of files) {
        const raw = await fs.readFile(`${VAULT}/${rel}`, "utf8");
        setLinks(rel, parseNote(rel, raw).links);
    }
    return files.length;
}