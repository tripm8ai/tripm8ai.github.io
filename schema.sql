-- D1 schema for the AI Glasses waitlist.
-- Apply with:  npx wrangler d1 execute tripm8-waitlist --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT,            -- traveler | business | both
  keenness   TEXT,            -- day-one | interested | curious
  note       TEXT,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS waitlist_created_at ON waitlist (created_at);
CREATE INDEX IF NOT EXISTS waitlist_keenness   ON waitlist (keenness);
