-- Structured pay and work-condition fields (all optional). Published only as aggregates
-- of 3+ answers, never per row, because combinations of them can point at a person.
ALTER TABLE submissions ADD COLUMN profit_sharing REAL;   -- 員工酬勞／分紅，萬／年
ALTER TABLE submissions ADD COLUMN stock_yearly REAL;     -- 股票，平均每年歸屬價值，萬
ALTER TABLE submissions ADD COLUMN sign_on REAL;          -- 簽約金，萬（一次性）
ALTER TABLE submissions ADD COLUMN weekly_hours REAL;     -- 平均每週實際工時
ALTER TABLE submissions ADD COLUMN overtime_pay TEXT;     -- legal / comp / partial / none / rare
ALTER TABLE submissions ADD COLUMN remote_days REAL;      -- 每週可遠端天數
ALTER TABLE submissions ADD COLUMN leave_days INTEGER;    -- 每年特休天數

-- 「我也想知道這家」: one counter per company page, nothing about who asked.
CREATE TABLE wants (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- One vote per company per daily-salted IP hash; rows older than a day carry no meaning.
CREATE TABLE want_votes (
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  slug TEXT NOT NULL,
  PRIMARY KEY (day, ip_hash, slug)
);
