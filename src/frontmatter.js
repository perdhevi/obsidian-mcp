import YAML from "yaml";

// Optional BOM, "---", the YAML lines, closing "---"
const FM = /^﻿?---\r?\n([\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

export function parseFrontmatter(raw) {
    const m = raw.match(FM);
    if (!m) return { data: {}, content: raw };
    let data = {};
    try {
        const parsed = YAML.parse(m[1] ?? "");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed;
    } catch {
        // Malformed YAML: keep the body, treat frontmatter as empty
    }
    return { data, content: raw.slice(m[0].length) };
}

export function stringifyFrontmatter(body, data) {
    return `---\n${YAML.stringify(data)}---\n\n${body}`;
}