import fs from "node:fs/promises";
import { VAULT } from "./config.js";
import { listNotes, parseNote, hashOf } from "./parse.js";
import { embedDocs } from "./embed.js";
import { replaceNote, removeNote } from "./store.js";

export async function indexFile(rel) {
    const abs = `${VAULT}/${rel}`;
    const [raw, stat] = await Promise.all([fs.readFile(abs, "utf8"), fs.stat(abs)]);
    const note = parseNote(rel, raw);
    const vectors = note.chunks.length ? await embedDocs(note.chunks.map((c) => c.embedText)) : [];
    const rows = note.chunks.map((c, i) => ({
        id: `${rel}#${c.idx}`, path: rel, heading: c.heading, text: c.text, vector: vectors[i],
    }));
    await replaceNote({ path: rel, hash: hashOf(raw), mtime: stat.mtimeMs }, rows);
    return note;
}

export { removeNote as removeFile };

export async function fullReindex() {
    const files = await listNotes(VAULT);
    for (const rel of files) { await indexFile(rel); console.error("indexed", rel); }
    return files.length;
}