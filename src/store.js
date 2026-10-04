import * as lancedb from "@lancedb/lancedb";
import { DB_PATH } from "./config.js";

const db = await lancedb.connect(DB_PATH);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`; // escape for SQL filters

async function table(name, firstRows) {
    if ((await db.tableNames()).includes(name)) return db.openTable(name);
    return firstRows?.length ? db.createTable(name, firstRows) : null; // schema comes from the first rows
}

export async function replaceNote(meta, chunkRows) {
    const chunks = await table("chunks", chunkRows);
    const notes = await table("notes", [meta]);
    // created just now with these rows? then we're done
    if (chunks) { await chunks.delete(`path = ${q(meta.path)}`); if (chunkRows.length) await chunks.add(chunkRows); }
    if (notes) { await notes.delete(`path = ${q(meta.path)}`); await notes.add([meta]); }
}

export async function removeNote(path) {
    for (const name of ["chunks", "notes"]) {
        const t = await table(name);
        if (t) await t.delete(`path = ${q(path)}`);
    }
}

export async function search(vector, { limit = 5, folder } = {}) {
    /* dumping the number of rows in each tables
    console.log("chunks table content:", await (await db.openTable("chunks")).countRows());
    console.log("embeddings table content:",await (await db.openTable("notes")).countRows());
    */

    const t = await table("chunks");
    if (!t) return [];
    let s = t.vectorSearch(vector).distanceType("cosine").limit(limit);
    if (folder) s = s.where(`path LIKE ${q(folder.replace(/\/$/, "") + "/%")}`);
    return s.toArray();
}

export async function allNoteMeta() {
    const t = await table("notes");
    return t ? t.query().select(["path", "hash", "mtime"]).toArray() : [];
}