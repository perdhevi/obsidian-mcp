// src/config.js
import path from "node:path";
export const VAULT = path.resolve(process.env.VAULT_PATH);
export const INBOX = process.env.INBOX_DIR ?? "Inbox";
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const DB_PATH = process.env.DB_PATH ?? "./data/lancedb";
export const PORT = Number(process.env.PORT ?? 3000);