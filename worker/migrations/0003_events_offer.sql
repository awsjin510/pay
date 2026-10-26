-- Product analytics as daily counters only: no IP, cookie, user or device id is stored.
CREATE TABLE events (
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name, scope, ref)
);

-- 'current' = salary the person is paid now; 'offer' = an offer they received.
ALTER TABLE submissions ADD COLUMN kind TEXT NOT NULL DEFAULT 'current';
