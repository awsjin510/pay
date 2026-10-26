-- Where a submission came from (?ref=podcast, ptt, …) and whether it skipped manual review.
ALTER TABLE submissions ADD COLUMN ref TEXT;
ALTER TABLE submissions ADD COLUMN auto_approved INTEGER NOT NULL DEFAULT 0;
CREATE INDEX submissions_ref ON submissions (ref);
