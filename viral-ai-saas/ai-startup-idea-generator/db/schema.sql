CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  industry TEXT NOT NULL,
  vibe TEXT NOT NULL,
  startup_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  valuation TEXT NOT NULL,
  investor_feedback TEXT NOT NULL,
  team_roles TEXT NOT NULL,
  market_size TEXT NOT NULL,
  absurdity_score INTEGER NOT NULL,
  viability_score INTEGER NOT NULL,
  share_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
