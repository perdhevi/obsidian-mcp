import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNote } from "../src/parse.js";

test("ignores # inside code fences", () => {
    const n = parseNote("a.md", "# A\ntext\n```\n# not a heading\n```\n");
    assert.equal(n.chunks.length, 1);
});

test("normalizes link forms", () => {
    const n = parseNote("b.md", "[[Idea]] [[Idea#Goals]] [[Idea|alias]]");
    assert.deepEqual(n.links, ["Idea", "Idea", "Idea"]);
});

test("reads frontmatter tags", () => {
    const n = parseNote("c.md", "---\ntags: [x, y]\n---\nbody #z");
    assert.deepEqual(n.tags.sort(), ["x", "y", "z"]);
});