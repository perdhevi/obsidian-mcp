const outgoing = new Map(); // source path -> Set of link names as written
const paths = new Set();     // every note path

export function setLinks(src, linkNames) { paths.add(src); outgoing.set(src, new Set(linkNames)); }
export function dropNote(src) { paths.delete(src); outgoing.delete(src); }

export function resolve(name) {
    const want = name.toLowerCase().replace(/\.md$/, "");
    const matches = [...paths].filter((p) => {
        const noExt = p.toLowerCase().replace(/\.md$/, "");
        return noExt === want || noExt.endsWith("/" + want);
    });
    return matches.sort((a, b) => a.length - b.length)[0] ?? null;
}

export function backlinksOf(target) {
    const out = [];
    for (const [src, names] of outgoing)
        for (const n of names) if (resolve(n) === target) { out.push(src); break; }
    return out;
}