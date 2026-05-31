CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  twitter_handle TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  traits TEXT NOT NULL,
  writing_style TEXT NOT NULL,
  vibe_summary TEXT NOT NULL,
  interests TEXT NOT NULL,
  toxicity_score INTEGER NOT NULL,
  humor_score INTEGER NOT NULL,
  intelligence_score INTEGER NOT NULL,
  share_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
