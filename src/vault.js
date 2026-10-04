import fs from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.js"
import { VAULT } from "./config.js";

export function resolveInVault(rel) {
    const abs = path.resolve(VAULT, rel);
    if (abs !== VAULT && !abs.startsWith(VAULT + path.sep)) throw new Error("Path outside vault");
    return abs;
}

export const toRel = (abs) => path.relative(VAULT, abs).split(path.sep).join("/");

export async function readNote(rel) {
    const raw = await fs.readFile(resolveInVault(rel), "utf8");
    const { data, content } = parseFrontmatter(raw);
    return { path: rel, frontmatter: data, content };
}