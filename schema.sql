-- D1 schema for the AI Glasses MVP validation survey.
-- Apply with:  npx wrangler d1 execute tripm8-waitlist --remote --file=./schema.sql
--
-- One row per respondent, written progressively: each step of the form upserts
-- on response_id, so people who abandon halfway still leave their answers and
-- last_step shows exactly where the funnel leaks.

CREATE TABLE IF NOT EXISTS waitlist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id TEXT NOT NULL UNIQUE,
  email       TEXT UNIQUE,          -- only set once step 3 completes

  -- Step 1: who is answering
  trips       TEXT,                 -- rarely | few | monthly | constantly
  role        TEXT,                 -- traveler | business | both

  -- Step 2: is the problem real, and what do we build first
  frictions   TEXT,                 -- comma-separated subset of the friction list
  first_use   TEXT,                 -- see | ask | navigate | book

  -- Step 3: would they actually buy it
  price       TEXT,                 -- free-only | under-199 | 199-349 | 350-599 | 600-plus
  beta        INTEGER DEFAULT 0,    -- 1 = willing to test an early build
  note        TEXT,

  country     TEXT,
  last_step   INTEGER NOT NULL DEFAULT 0,
  completed   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT
);

CREATE INDEX IF NOT EXISTS waitlist_created   ON waitlist (created_at);
CREATE INDEX IF NOT EXISTS waitlist_funnel    ON waitlist (last_step, completed);
CREATE INDEX IF NOT EXISTS waitlist_price     ON waitlist (price);
CREATE INDEX IF NOT EXISTS waitlist_first_use ON waitlist (first_use);
