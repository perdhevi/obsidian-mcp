import chokidar from "chokidar";
import { VAULT } from "./config.js";
import { toRel } from "./vault.js";
import { indexFile, removeFile } from "./indexer.js";

const DEBOUNCE_MS = 1500;
const timers = new Map();
let chain = Promise.resolve(); // serial queue: one job at a time

const enqueue = (job) => (chain = chain.then(job).catch((e) => console.error("index error:", e.message)));

function schedule(rel, kind) {
    clearTimeout(timers.get(rel));
    timers.set(rel, setTimeout(() => {
        timers.delete(rel);
        enqueue(() => (kind === "remove" ? removeFile(rel) : indexFile(rel)));
        console.error(kind, rel);
    }, DEBOUNCE_MS));
}

export function startWatcher() {
    const ignored = (p) => /[\\/]\.(obsidian|trash|git)([\\/]|$)/.test(p);
    chokidar.watch(VAULT, { ignored, ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 300 } })
        .on("add", (p) => p.endsWith(".md") && schedule(toRel(p), "index"))
        .on("change", (p) => p.endsWith(".md") && schedule(toRel(p), "index"))
        .on("unlink", (p) => p.endsWith(".md") && schedule(toRel(p), "remove"));
}

export { enqueue };