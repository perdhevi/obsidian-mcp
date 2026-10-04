import { fullReindex } from "../src/indexer.js";
import { embedQuery } from "../src/embed.js";
import { search } from "../src/store.js";

if (process.argv.includes("--reindex")) console.log("notes:", await fullReindex());
const query = process.argv.filter((a) => !a.startsWith("--")).slice(2).join(" ");
for (const r of await search(await embedQuery(query), { limit: 5 }))
    console.log(r._distance.toFixed(3), r.path, ">", r.heading || "(top)");