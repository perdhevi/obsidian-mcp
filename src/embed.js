import { OLLAMA_URL } from "./config.js";

const MODEL = "nomic-embed-text";

async function embed(inputs) {
    const r = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, input: inputs }),
    });
    if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
    return (await r.json()).embeddings; // one array of numbers per input
}

// nomic-embed-text was trained with task prefixes. Leaving them out hurts retrieval.
export const embedDocs = (texts) => embed(texts.map((t) => `search_document: ${t}`));
export const embedQuery = async (q) => (await embed([`search_query: ${q}`]))[0];