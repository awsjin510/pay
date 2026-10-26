-- Salary submissions from the site's form. Nothing is published until status = 'approved'.
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  track TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  level TEXT,
  yoe REAL,
  yoe_current REAL,
  monthly REAL NOT NULL,
  bonus_months REAL,
  annual REAL,
  hours_per_day REAL,
  overtime_per_month REAL,
  overtime_freq INTEGER,
  happiness INTEGER,
  loading INTEGER,
  certifications TEXT,
  interview_topics TEXT,
  comment TEXT,
  ip_hash TEXT NOT NULL
);
CREATE INDEX submissions_status ON submissions (status);
CREATE INDEX submissions_ip_day ON submissions (ip_hash, created_at);

-- Takedown requests, error reports and contact messages.
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  kind TEXT NOT NULL CHECK (kind IN ('takedown', 'error', 'contact')),
  target TEXT,
  message TEXT NOT NULL,
  contact TEXT,
  ip_hash TEXT NOT NULL
);
CREATE INDEX reports_ip_day ON reports (ip_hash, created_at);
