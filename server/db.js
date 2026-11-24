import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The Vercel deploy folder is read-only. /tmp is writable but wiped when the function restarts.
let file = process.env.DB_PATH;
if (!file && process.env.VERCEL) {
  file = '/tmp/weather.db';
} else if (!file) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), 'data');
  mkdirSync(dir, { recursive: true });
  file = join(dir, 'weather.db');
}

const db = new DatabaseSync(file);

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_queries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    query      TEXT NOT NULL,
    city       TEXT NOT NULL,
    country    TEXT,
    lat        REAL NOT NULL,
    lon        REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date   TEXT NOT NULL,
    daily      TEXT NOT NULL,
    notes      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export default db;
