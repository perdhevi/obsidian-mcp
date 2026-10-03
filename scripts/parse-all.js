import fs from "node:fs/promises";
import { VAULT } from "../src/config.js";
import { listNotes, parseNote } from "../src/parse.js";

for (const rel of await listNotes(VAULT)) {
    const n = parseNote(rel, await fs.readFile(`${VAULT}/${rel}`, "utf8"));
    console.log(`${rel}  links=${n.links.length} tags=${n.tags.join(",")} chunks=${n.chunks.length}`);
    for (const c of n.chunks) console.log(`   [${c.heading || "(top)"}] ${c.text.slice(0, 60).replace(/\n/g, " ")}`);
}