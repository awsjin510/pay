// API in front of the static site. Only /api/* reaches this code (run_worker_first in
// wrangler.jsonc); every other path is served straight from out/.

interface D1Result<T> {
  results: T[];
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}
interface Env {
  pay_db: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const MAX_PER_DAY = 5;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

class Invalid extends Error {}

function str(v: unknown, field: string, max: number, required = false): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw new Invalid(`${field} 必填`);
    return null;
  }
  if (s.length > max) throw new Invalid(`${field} 最多 ${max} 字`);
  return s;
}

function numIn(v: unknown, field: string, min: number, max: number, required = false): number | null {
  if (v === "" || v == null) {
    if (required) throw new Invalid(`${field} 必填`);
    return null;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new Invalid(`${field} 需介於 ${min}–${max}`);
  return n;
}

// Daily-salted hash: enough to rate-limit, not enough to track a person across days.
async function ipHash(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${day}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function overLimit(db: D1Database, table: "submissions" | "reports", hash: string) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ip_hash = ? AND created_at >= datetime('now', '-1 day')`)
    .bind(hash)
    .first<{ n: number }>();
  return (row?.n ?? 0) >= MAX_PER_DAY;
}

async function createSubmission(request: Request, env: Env) {
  const b = (await request.json()) as Record<string, unknown>;
  // Honeypot: real visitors never see this field.
  if (b.website) return json({ ok: true });
  if (b.agree !== true) throw new Invalid("請勾選同意投稿規範");
  const track = str(b.track, "產業", 10, true)!;
  if (!["soft", "system", "ic"].includes(track)) throw new Invalid("產業不正確");
  const company = str(b.company, "公司", 80, true)!;
  const role = str(b.role, "職務", 60, true)!;
  const monthly = numIn(b.monthly, "月底薪", 2, 80, true)!;
  const bonus = numIn(b.bonus_months, "Bonus", 0, 60);
  const annual = numIn(b.annual, "總年薪", 15, 3000);
  const certifications = str(b.certifications, "證照", 120);
  const interviewTopics = str(b.interview_topics, "面試題型", 400);
  const comment = str(b.comment, "心得", 1000);
  const ref = typeof b.ref === "string" ? b.ref.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null : null;
  const kind = b.kind === "offer" ? "offer" : "current";
  const profitSharing = numIn(b.profit_sharing, "員工酬勞", 0, 2000);
  const stockYearly = numIn(b.stock_yearly, "股票", 0, 3000);
  const signOn = numIn(b.sign_on, "簽約金", 0, 500);
  const overtimePay = b.overtime_pay == null || b.overtime_pay === "" ? null : String(b.overtime_pay);
  if (overtimePay && !OVERTIME_PAY.includes(overtimePay)) throw new Invalid("加班費選項不正確");
  const auto = autoApprovable({ company, role, monthly, bonus, annual, profitSharing, stockYearly, signOn, freeText: [certifications, interviewTopics, comment] });

  const hash = await ipHash(request);
  if (await overLimit(env.pay_db, "submissions", hash)) return json({ error: "今天投稿次數已達上限，請明天再試" }, 429);
  await env.pay_db
    .prepare(
      `INSERT INTO submissions (track, company, role, level, yoe, yoe_current, monthly, bonus_months, annual,
        hours_per_day, overtime_per_month, overtime_freq, happiness, loading, certifications, interview_topics, comment,
        ip_hash, ref, status, auto_approved, kind,
        profit_sharing, stock_yearly, sign_on, weekly_hours, overtime_pay, remote_days, leave_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      track,
      company,
      role,
      str(b.level, "職級", 30),
      numIn(b.yoe, "相關年資", 0, 50),
      numIn(b.yoe_current, "現職年資", 0, 50),
      monthly,
      bonus,
      annual,
      numIn(b.hours_per_day, "每日工時", 1, 16),
      numIn(b.overtime_per_month, "每月加班", 0, 250),
      numIn(b.overtime_freq, "加班頻率", 1, 5),
      numIn(b.happiness, "爽度", 1, 5),
      numIn(b.loading, "Loading", 1, 5),
      certifications,
      interviewTopics,
      comment,
      hash,
      ref,
      auto ? "approved" : "pending",
      auto ? 1 : 0,
      kind,
      profitSharing,
      stockYearly,
      signOn,
      numIn(b.weekly_hours, "每週工時", 10, 100),
      overtimePay,
      numIn(b.remote_days, "遠端天數", 0, 5),
      numIn(b.leave_days, "特休天數", 0, 60),
    )
    .run();
  return json({ ok: true, status: auto ? "approved" : "pending" }, 201);
}

// Numbers-only submissions with plausible values skip the queue; anything with free text
// (心得, 證照, 面試題型) or odd numbers waits for a person. Weekly sync publishes approved rows.
const CONTACT_OR_LINK = /https?:|www\.|@|\d{4}[-\s]?\d{3}[-\s]?\d{3}/i;
const OVERTIME_PAY = ["legal", "comp", "partial", "none", "rare"];
function autoApprovable(x: {
  company: string;
  role: string;
  monthly: number;
  bonus: number | null;
  annual: number | null;
  profitSharing: number | null;
  stockYearly: number | null;
  signOn: number | null;
  freeText: (string | null)[];
}) {
  if (x.freeText.some(Boolean)) return false;
  if (CONTACT_OR_LINK.test(x.company) || CONTACT_OR_LINK.test(x.role)) return false;
  if (/^\d+$/.test(x.company) || x.company.length < 2) return false;
  if (x.monthly < 2.5 || x.monthly > 40) return false;
  if (x.bonus != null && x.bonus > 24) return false;
  if (x.annual != null) {
    const est = x.monthly * (12 + (x.bonus ?? 0));
    if (x.annual < x.monthly * 12 * 0.9 || x.annual > est * 4) return false;
  }
  // Equity and profit sharing can dwarf base pay at a few companies; those get a human look.
  if ((x.profitSharing ?? 0) + (x.stockYearly ?? 0) > x.monthly * 36) return false;
  if (x.signOn != null && x.signOn > x.monthly * 6) return false;
  return true;
}

async function createReport(request: Request, env: Env) {
  const b = (await request.json()) as Record<string, unknown>;
  if (b.website) return json({ ok: true });
  const kind = str(b.kind, "類型", 20, true)!;
  if (!["takedown", "error", "contact"].includes(kind)) throw new Invalid("類型不正確");
  const message = str(b.message, "說明", 2000, true)!;
  if (message.length < 10) throw new Invalid("說明至少 10 字");
  const hash = await ipHash(request);
  if (await overLimit(env.pay_db, "reports", hash)) return json({ error: "今天送出次數已達上限，請明天再試" }, 429);
  await env.pay_db
    .prepare("INSERT INTO reports (kind, target, message, contact, ip_hash) VALUES (?, ?, ?, ?, ?)")
    .bind(kind, str(b.target, "對象", 300), message, str(b.contact, "聯絡方式", 120), hash)
    .run();
  return json({ ok: true }, 201);
}

// Product analytics: whitelisted event names, aggregated into daily counters. Nothing that
// identifies a person or device is read or stored.
const EVENTS = new Set([
  "answer_view", "thin_view", "search_select", "search_empty", "submit_view", "submit_start", "submit_success",
  "submit_error", "share_click", "share_download", "offer_view", "offer_check", "offer_share_click", "compare_used",
  "want_click", "invite_click", "calc_view", "calc_compute", "calc_check_click", "negotiate_copy",
]);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.toLowerCase().replace(/[^a-z0-9:_-]/g, "").slice(0, max) : "");

async function recordEvent(request: Request, env: Env) {
  const text = await request.text();
  if (text.length > 500) return new Response(null, { status: 204 });
  const b = JSON.parse(text) as Record<string, unknown>;
  const name = clean(b.name, 30);
  if (!EVENTS.has(name)) return new Response(null, { status: 204 });
  await env.pay_db
    .prepare(
      `INSERT INTO events (day, name, scope, ref, count) VALUES (date('now'), ?, ?, ?, 1)
       ON CONFLICT (day, name, scope, ref) DO UPDATE SET count = count + 1`,
    )
    .bind(name, clean(b.scope, 40), clean(b.ref, 40))
    .run();
  return new Response(null, { status: 204 });
}

// Counts only, for the daily review reminder (.github/workflows/review-alert.yml).
async function pendingCount(env: Env) {
  const subs = await env.pay_db.prepare("SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending'").first<{ n: number }>();
  const reports = await env.pay_db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'").first<{ n: number }>();
  return json({ submissions: subs?.n ?? 0, reports: reports?.n ?? 0 }, 200, { "cache-control": "no-store" });
}

// Read by the site build (etl/build.mjs). Public columns of approved rows only.
async function listApproved(env: Env) {
  const { results } = await env.pay_db
    .prepare(
      `SELECT id, created_at, track, company, role, level, yoe, yoe_current, monthly, bonus_months, annual,
        hours_per_day, overtime_per_month, overtime_freq, happiness, loading, certifications, interview_topics, comment, kind,
        profit_sharing, stock_yearly, sign_on, weekly_hours, overtime_pay, remote_days, leave_days
       FROM submissions WHERE status = 'approved' ORDER BY id`,
    )
    .all();
  return json(results, 200, { "cache-control": "public, max-age=300" });
}

// 「我也想知道這家」. Slugs are checked against the published search index, so the table
// only ever holds real company pages.
let slugCache: Promise<Set<string>> | null = null;
function knownSlugs(request: Request, env: Env) {
  slugCache ??= env.ASSETS.fetch(new Request(new URL("/search-index.json", request.url)))
    .then((r) => r.json() as Promise<{ s: string }[]>)
    .then((rows) => new Set(rows.map((r) => r.s)))
    .catch((e) => {
      slugCache = null;
      throw e;
    });
  return slugCache;
}

const MAX_WANTS_PER_DAY = 30;

async function addWant(request: Request, env: Env) {
  const b = (await request.json()) as Record<string, unknown>;
  const slug = typeof b.slug === "string" ? b.slug : "";
  if (!(await knownSlugs(request, env)).has(slug)) throw new Invalid("找不到這間公司");
  const hash = await ipHash(request);
  const today = await env.pay_db
    .prepare("SELECT COUNT(*) AS n FROM want_votes WHERE day = date('now') AND ip_hash = ?")
    .bind(hash)
    .first<{ n: number }>();
  if ((today?.n ?? 0) < MAX_WANTS_PER_DAY) {
    const res = await env.pay_db.prepare("INSERT OR IGNORE INTO want_votes (day, ip_hash, slug) VALUES (date('now'), ?, ?)").bind(hash, slug).run();
    if (res.meta?.changes) {
      await env.pay_db.prepare("INSERT INTO wants (slug, count) VALUES (?, 1) ON CONFLICT (slug) DO UPDATE SET count = count + 1").bind(slug).run();
      await env.pay_db.prepare("DELETE FROM want_votes WHERE day < date('now', '-2 day')").run();
    }
  }
  return wantCount(env, slug);
}

async function wantCount(env: Env, slug: string) {
  const row = await env.pay_db.prepare("SELECT count FROM wants WHERE slug = ?").bind(slug).first<{ count: number }>();
  return json({ slug, count: row?.count ?? 0 }, 200, { "cache-control": "no-store" });
}

// Read by the site build for the 「大家最想知道」 list.
async function topWants(env: Env) {
  const { results } = await env.pay_db.prepare("SELECT slug, count FROM wants WHERE count >= 2 ORDER BY count DESC LIMIT 30").all();
  return json(results, 200, { "cache-control": "public, max-age=300" });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/submissions" && request.method === "POST") return await createSubmission(request, env);
      if (pathname === "/api/reports" && request.method === "POST") return await createReport(request, env);
      if (pathname === "/api/approved" && request.method === "GET") return await listApproved(env);
      if (pathname === "/api/pending-count" && request.method === "GET") return await pendingCount(env);
      if (pathname === "/api/events" && request.method === "POST") return await recordEvent(request, env);
      if (pathname === "/api/wants" && request.method === "POST") return await addWant(request, env);
      if (pathname === "/api/wants" && request.method === "GET") return await wantCount(env, new URL(request.url).searchParams.get("slug") ?? "");
      if (pathname === "/api/wants/top" && request.method === "GET") return await topWants(env);
      if (pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (e) {
      if (e instanceof Invalid) return json({ error: e.message }, 400);
      if (e instanceof SyntaxError) return json({ error: "格式錯誤" }, 400);
      console.error(e);
      return json({ error: "伺服器錯誤，請稍後再試" }, 500);
    }
  },
};

export default worker;
