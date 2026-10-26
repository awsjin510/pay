// Fetch the 薪資紀錄 Google Sheet, approved web submissions and official disclosures, clean
// them, and write data/*.json (for the site) and public/data/*.csv (open data).
//
//   node etl/build.mjs           # use cached sources in data/raw
//   node etl/build.mjs --fetch   # re-download everything first
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseCsv } from "./csv.mjs";
import { ANONYMOUS_PATTERNS, buildAliasIndex, COMPANIES, normalizeKey, sectorFromName } from "./companies.mjs";
import { fetchMol, occupationReference, readMol, ROLE_TO_OCCUPATION } from "./mol.mjs";
import { fetchOfficial, INDUSTRY_LABELS, readOfficial } from "./official.mjs";
import { HARSH, rareTitleFilter, scrubComment } from "./privacy.mjs";
import { classifyRole, LEVEL_BANDS, levelBand, ROLES, OTHER_ROLE } from "./roles.mjs";
import { SECTORS, sectorFromRole, subRole, SUB_ROLES } from "./sectors.mjs";

const SITE = "https://pay.operation.tw";
const SHEET_ID = "1-lMc-QktDGlO05je0zyR7P7QnfuoaECcsGUeKZZy6q0";
const TABS = [
  { file: "interviews", gid: "0" },
  { file: "soft", gid: "819754168", track: "soft", label: "純軟" },
  { file: "system", gid: "37329018", track: "system", label: "系統廠" },
  { file: "ic", gid: "1298005689", track: "ic", label: "IC 設計" },
];
const WEB_SUBMISSIONS_URL = process.env.WEB_SUBMISSIONS_URL ?? `${SITE}/api/approved`;
// Fewer submissions than this and a company/role shows no aggregate numbers.
const MIN_N = 3;
const RECENT_FROM_YEAR = 2025;
const TODAY = new Date().toISOString().slice(0, 10);

const COMPANIES_BY_NAME = new Map(COMPANIES.map((c) => [c.name, c]));

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const OUT_DIR = new URL("../data/", import.meta.url);
const PUBLIC_DATA_DIR = new URL("../public/data/", import.meta.url);

async function fetchTabs() {
  for (const tab of TABS) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${tab.gid}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${tab.file}: HTTP ${res.status}`);
    await writeFile(new URL(`${tab.file}.csv`, RAW_DIR), await res.text());
    console.log(`fetched ${tab.file}`);
  }
}

// Social share images (app/**/opengraph-image.tsx) need a font with CJK glyphs.
const OG_FONT_URL = "https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf";
async function fetchOgFont() {
  const file = new URL("NotoSansTC-Bold.otf", RAW_DIR);
  try {
    await readFile(file);
    return;
  } catch {
    // not cached yet
  }
  const res = await fetch(OG_FONT_URL);
  if (!res.ok) throw new Error(`OG font: HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log("fetched OG font");
}

// The site's own API may not exist yet (first deploy) or be down; keep the last cache then.
async function fetchWebSubmissions() {
  try {
    const res = await fetch(WEB_SUBMISSIONS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(new URL("web.json", RAW_DIR), JSON.stringify(await res.json()));
    console.log("fetched web submissions");
  } catch (e) {
    console.warn(`web submissions not fetched (${e.message}); using cache if any`);
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(new URL(file, RAW_DIR), "utf8"));
  } catch {
    return fallback;
  }
}

// ── field cleaners ──────────────────────────────────────────────

function num(s) {
  const t = String(s ?? "").trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const round = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

// 月底薪 is supposed to be 萬, but ~380 rows are in 元 and a few look like 千元.
function cleanMonthly(raw, flags) {
  let v = num(raw);
  if (v == null) return null;
  if (v >= 1000) {
    v /= 10000;
    flags.push("monthly_unit_yuan");
  } else if (v > 50 && v <= 200) {
    v /= 10;
    flags.push("monthly_unit_guess_k");
  }
  if (v < 2 || v > 80) {
    flags.push("monthly_invalid");
    return null;
  }
  return round(v, 2);
}

function cleanBonus(raw, flags) {
  const t = String(raw ?? "").trim();
  if (t.endsWith("%")) {
    const pct = num(t.slice(0, -1));
    if (pct == null) return null;
    flags.push("bonus_from_percent");
    return round((pct / 100) * 12, 2);
  }
  const v = num(t);
  if (v == null) return null;
  if (v < 0 || v > 60) {
    flags.push("bonus_invalid");
    return null;
  }
  return v;
}

function cleanAnnual(raw, flags) {
  let v = num(raw);
  if (v == null) return null;
  if (v >= 10000) {
    v /= 10000;
    flags.push("annual_unit_yuan");
  }
  if (v < 15 || v > 3000) {
    flags.push("annual_invalid");
    return null;
  }
  return round(v, 1);
}

function inRange(raw, min, max) {
  const v = num(raw);
  return v != null && v >= min && v <= max ? v : null;
}

function cleanDate(raw, flags) {
  const m = String(raw ?? "").match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;
  const date = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  if (date > TODAY) {
    flags.push("future_date");
    return null;
  }
  return date;
}

function slugFor(name) {
  const ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (/^[\x00-\x7f]+$/.test(name) && ascii) return ascii;
  return "c-" + createHash("sha1").update(name).digest("hex").slice(0, 8);
}

// ── stats ──────────────────────────────────────────────────────

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function dist(values, d = 1) {
  const s = values.filter((v) => v != null).sort((a, b) => a - b);
  if (s.length < MIN_N) return null;
  return { n: s.length, p25: round(quantile(s, 0.25), d), median: round(quantile(s, 0.5), d), p75: round(quantile(s, 0.75), d) };
}

function mean(values) {
  const s = values.filter((v) => v != null);
  if (s.length < MIN_N) return null;
  return round(s.reduce((a, b) => a + b, 0) / s.length, 1);
}

const isOutlier = (r) => r.flags.includes("outlier");
const annualOf = (r) => r.annual ?? r.annualEstimate;

// Sorted monthly base pay, for the "where do I stand" percentile tool.
const monthlyValues = (rows) =>
  rows
    .filter((r) => !isOutlier(r) && r.monthly != null)
    .map((r) => round(r.monthly, 1))
    .sort((a, b) => a - b);

// Salary by years of experience, finer than LEVEL_BANDS, for the experience curve chart.
const YOE_BUCKETS = [
  [0, 1, "0"], [1, 2, "1"], [2, 3, "2"], [3, 4, "3"], [4, 5, "4"],
  [5, 7, "5–6"], [7, 10, "7–9"], [10, 15, "10–14"], [15, 51, "15+"],
];

function yoeCurve(rows) {
  const pay = rows.filter((r) => !isOutlier(r) && r.yoe != null);
  return YOE_BUCKETS.map(([lo, hi, label]) => {
    const sub = pay.filter((r) => r.yoe >= lo && r.yoe < hi);
    return { label, n: sub.length, monthly: dist(sub.map((r) => r.monthly), 1) };
  });
}

function yearMix(rows) {
  const out = {};
  for (const r of rows) out[r.year ?? "unknown"] = (out[r.year ?? "unknown"] ?? 0) + 1;
  return out;
}

function summarize(rows) {
  if (rows.length < MIN_N) return null;
  // Outliers stay visible as individual entries but never move a median.
  const pay = rows.filter((r) => !isOutlier(r));
  return {
    n: rows.length,
    monthly: dist(pay.map((r) => r.monthly), 1),
    annual: dist(pay.map(annualOf), 0),
    bonusMonths: dist(pay.map((r) => r.bonusMonths), 1),
    hoursPerDay: dist(rows.map((r) => r.hoursPerDay), 1),
    overtimePerMonth: dist(rows.map((r) => r.overtimePerMonth), 0),
    happiness: mean(rows.map((r) => r.happiness)),
    loading: mean(rows.map((r) => r.loading)),
    overtimeFreq: mean(rows.map((r) => r.overtimeFreq)),
    recentN: rows.filter((r) => r.year >= RECENT_FROM_YEAR).length,
    years: yearMix(rows),
    byLevel: LEVEL_BANDS.map((b) => {
      const sub = pay.filter((r) => r.level === b.id);
      return { level: b.id, n: rows.filter((r) => r.level === b.id).length, monthly: dist(sub.map((r) => r.monthly), 1), annual: dist(sub.map(annualOf), 0) };
    }),
  };
}

// A salary far outside its own company's spread (3 IQRs and more than 2× / under ½ the
// median) is almost certainly a typo — wrong unit, annual typed as monthly. Needs enough
// rows to know the spread.
function flagOutliers(rows) {
  const vals = rows.map((r) => r.monthly).filter((v) => v != null).sort((a, b) => a - b);
  if (vals.length < 8) return;
  const q1 = quantile(vals, 0.25);
  const q3 = quantile(vals, 0.75);
  const med = quantile(vals, 0.5);
  const iqr = q3 - q1;
  if (iqr <= 0) return;
  for (const r of rows) {
    const v = r.monthly;
    if (v == null) continue;
    if ((v > q3 + 3 * iqr && v > med * 2) || (v < q1 - 3 * iqr && v < med / 2)) r.flags.push("outlier");
  }
}

// ── sources → uniform raw records ──────────────────────────────

async function readTab(file) {
  const rows = parseCsv(await readFile(new URL(`${file}.csv`, RAW_DIR), "utf8"));
  return rows.slice(1).filter((r) => r.some((c) => c.trim()));
}

async function sheetRecords() {
  const out = [];
  for (const tab of TABS.filter((t) => t.track)) {
    for (const [i, r] of (await readTab(tab.file)).entries()) {
      out.push({
        id: `${tab.track}-${i + 1}`,
        source: "sheet",
        track: tab.track,
        date: r[0], company: r[1], role: r[2], level: r[3], yoe: r[4], yoeCurrent: r[5],
        monthly: r[6], bonus: r[7], annual: r[8], hours: r[9], overtime: r[10], overtimeFreq: r[11],
        happiness: r[12], loading: r[13], comment: r[14],
      });
    }
  }
  return out;
}

// Rows approved in the site's review queue (D1 table `submissions`, see worker/).
async function webRecords() {
  const rows = await readJson("web.json", []);
  return rows.map((r) => ({
    id: `web-${r.id}`,
    source: "web",
    track: ["soft", "system", "ic"].includes(r.track) ? r.track : "soft",
    date: r.created_at, company: r.company, role: r.role, level: r.level ?? "", yoe: r.yoe, yoeCurrent: r.yoe_current,
    monthly: r.monthly, bonus: r.bonus_months, annual: r.annual, hours: r.hours_per_day, overtime: r.overtime_per_month,
    overtimeFreq: r.overtime_freq, happiness: r.happiness, loading: r.loading, comment: r.comment ?? "",
    certifications: r.certifications || null, interviewTopics: r.interview_topics || null,
  }));
}

// ── CSV export ─────────────────────────────────────────────────

function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens the Chinese headers correctly.
  return "﻿" + [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => esc(c.value(r))))].map((l) => l.join(",")).join("\n") + "\n";
}

const statColumns = [
  { header: "筆數", value: (r) => r.stats?.n },
  { header: `${RECENT_FROM_YEAR}年後筆數`, value: (r) => r.stats?.recentN },
  { header: "月底薪P25(萬)", value: (r) => r.stats?.monthly?.p25 },
  { header: "月底薪中位數(萬)", value: (r) => r.stats?.monthly?.median },
  { header: "月底薪P75(萬)", value: (r) => r.stats?.monthly?.p75 },
  { header: "總年薪中位數(萬)", value: (r) => r.stats?.annual?.median },
  { header: "Bonus中位數(月)", value: (r) => r.stats?.bonusMonths?.median },
  { header: "每日工時中位數", value: (r) => r.stats?.hoursPerDay?.median },
  { header: "爽度平均(1-5)", value: (r) => r.stats?.happiness },
  { header: "Loading平均(1-5)", value: (r) => r.stats?.loading },
];

// ── main ───────────────────────────────────────────────────────

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(PUBLIC_DATA_DIR, { recursive: true });
  if (process.argv.includes("--fetch")) {
    await fetchTabs();
    await fetchOfficial(RAW_DIR);
    await fetchMol(RAW_DIR);
    await fetchWebSubmissions();
    await fetchOgFont();
  }
  const aliases = buildAliasIndex();
  const takedowns = JSON.parse(await readFile(new URL("./takedowns.json", import.meta.url), "utf8"));
  const droppedRows = new Set(takedowns.rows);
  const droppedComments = new Set(takedowns.comments);
  const submissions = [];
  const companies = new Map();
  const rawNameCounts = new Map();

  for (const rec of [...(await sheetRecords()), ...(await webRecords())]) {
    if (droppedRows.has(rec.id)) continue;
    if (droppedComments.has(rec.id)) rec.comment = "";
    const flags = [];
    const rawCompany = String(rec.company ?? "").trim();
    const key = normalizeKey(rawCompany);
    const known = aliases.scoped[rec.track].get(key) ?? aliases.global.get(key);
    const anonymous = !known && ANONYMOUS_PATTERNS.some((p) => p.test(rawCompany.normalize("NFKC")));

    let companyKey = null;
    if (known) companyKey = `known:${known.name}`;
    else if (!anonymous && key) companyKey = `raw:${key}`;
    if (companyKey) {
      if (!companies.has(companyKey)) {
        companies.set(companyKey, { known, tracks: new Map(), rows: [] });
        rawNameCounts.set(companyKey, new Map());
      }
      const counts = rawNameCounts.get(companyKey);
      counts.set(rawCompany, (counts.get(rawCompany) ?? 0) + 1);
    }

    const roleRaw = String(rec.role ?? "").trim();
    const monthly = cleanMonthly(rec.monthly, flags);
    const bonusMonths = cleanBonus(rec.bonus, flags);
    const annual = cleanAnnual(rec.annual, flags);
    const annualEstimate = annual == null && monthly != null && bonusMonths != null ? round(monthly * (12 + bonusMonths), 1) : null;
    if (annualEstimate != null) flags.push("annual_estimated");
    // 總年薪 includes 分紅, so it may legitimately exceed 月薪×(12+Bonus); only a total below
    // twelve months of base pay, or more than 4× the estimate, is implausible.
    if (annual != null && monthly != null) {
      const est = monthly * (12 + (bonusMonths ?? 0));
      if (annual < monthly * 12 * 0.9) flags.push("annual_below_base");
      else if (annual > est * 4) flags.push("annual_far_above_estimate");
    }
    const yoe = inRange(rec.yoe, 0, 50);
    const date = cleanDate(rec.date, flags);
    const role = classifyRole(roleRaw, rec.track);
    const comment = String(rec.comment ?? "").trim();
    const harsh = HARSH.test(comment);
    if (harsh) flags.push("comment_harsh");
    const sectorRole = sectorFromRole(roleRaw);

    const row = {
      id: rec.id,
      source: rec.source,
      track: rec.track,
      companyKey,
      companyRaw: rawCompany,
      roleRaw,
      role: role.id,
      sectorRole,
      subRole: sectorRole ? subRole(sectorRole, roleRaw).id : null,
      sectorCompany: known?.sector ?? (known ? null : sectorFromName(rawCompany)),
      levelRaw: String(rec.level ?? "").trim(),
      level: levelBand(yoe),
      yoe,
      yoeCurrent: inRange(rec.yoeCurrent, 0, 50),
      monthly,
      bonusMonths,
      annual,
      annualEstimate,
      hoursPerDay: inRange(rec.hours, 1, 16),
      overtimePerMonth: inRange(rec.overtime, 0, 250),
      overtimeFreq: inRange(rec.overtimeFreq, 1, 5),
      happiness: inRange(rec.happiness, 1, 5),
      loading: inRange(rec.loading, 1, 5),
      // Hidden comments are dropped from the published data, not just hidden in the UI.
      comment: harsh || !comment ? null : scrubComment(comment),
      commentHidden: harsh,
      certifications: rec.certifications ?? null,
      interviewTopics: rec.interviewTopics ?? null,
      date,
      year: date ? Number(date.slice(0, 4)) : null,
      flags,
    };
    submissions.push(row);
    if (companyKey) {
      const c = companies.get(companyKey);
      c.rows.push(row);
      c.tracks.set(rec.track, (c.tracks.get(rec.track) ?? 0) + 1);
    }
  }

  for (const c of companies.values()) flagOutliers(c.rows);

  // De-identify: a title or 職級 string seen only once could point at one person.
  const keepRole = rareTitleFilter(submissions, "roleRaw");
  const keepLevel = rareTitleFilter(submissions, "levelRaw");
  for (const s of submissions) {
    const role = keepRole(s.roleRaw);
    if (s.roleRaw && !role) s.flags.push("rare_title_merged");
    s.roleRaw = role;
    s.levelRaw = keepLevel(s.levelRaw);
  }

  const official = await readOfficial(RAW_DIR);
  const officialByKey = new Map();
  for (const o of official) {
    const known = aliases.global.get(normalizeKey(o.name));
    if (known?.official === false) continue;
    officialByKey.set(known ? `known:${known.name}` : `raw:${normalizeKey(o.name)}`, o);
  }

  // Resolve display names, slugs and the primary track for every company.
  const companyList = [];
  const usedSlugs = new Set();
  for (const [key, c] of companies) {
    const rawNames = [...rawNameCounts.get(key).entries()].sort((a, b) => b[1] - a[1]);
    const name = c.known?.name ?? rawNames[0][0];
    let slug = slugFor(c.known?.en && /^[\x00-\x7f]+$/.test(c.known.en) ? c.known.en : name);
    while (usedSlugs.has(slug)) slug += "-2";
    usedSlugs.add(slug);
    const track = c.known?.track ?? [...c.tracks.entries()].sort((a, b) => b[1] - a[1])[0][0];
    for (const row of c.rows) row.company = slug;
    const stats = summarize(c.rows);
    companyList.push({
      slug,
      name,
      en: c.known?.en ?? null,
      track,
      sector: c.rows[0].sectorCompany,
      verified: Boolean(c.known),
      aliases: rawNames.map(([n]) => n).filter((n) => n !== name),
      n: c.rows.length,
      latest: c.rows.map((r) => r.date).filter(Boolean).sort().at(-1) ?? null,
      official: officialByKey.get(key) ?? null,
      stats,
      recentStats: summarize(c.rows.filter((r) => r.year >= RECENT_FROM_YEAR)),
      monthlyValues: stats ? monthlyValues(c.rows) : [],
      curve: stats ? yoeCurve(c.rows) : [],
    });
  }
  for (const s of submissions) delete s.companyKey;
  companyList.sort((a, b) => b.n - a.n);

  const tracks = TABS.filter((t) => t.track).map((t) => {
    const rows = submissions.filter((s) => s.track === t.track);
    return {
      id: t.track,
      label: t.label,
      stats: summarize(rows),
      recentStats: summarize(rows.filter((s) => s.year >= RECENT_FROM_YEAR)),
      monthlyValues: monthlyValues(rows),
      curve: yoeCurve(rows),
      roles: [...ROLES, OTHER_ROLE]
        .map((r) => ({ role: r.id, stats: summarize(rows.filter((s) => s.role === r.id)) }))
        .filter((r) => r.stats),
    };
  });

  const mol = await readMol(RAW_DIR);

  const roles = [...ROLES, OTHER_ROLE].map((r) => {
    const rows = submissions.filter((s) => s.role === r.id);
    return {
      id: r.id,
      label: r.label,
      stats: summarize(rows),
      officialRef: occupationReference(mol, ROLE_TO_OCCUPATION[r.id]),
      monthlyValues: monthlyValues(rows),
      curve: yoeCurve(rows),
      byTrack: TABS.filter((t) => t.track).map((t) => ({ track: t.track, stats: summarize(rows.filter((s) => s.track === t.track)) })),
      topCompanies: companyList
        .map((c) => ({ slug: c.slug, name: c.name, stats: summarize(rows.filter((s) => s.company === c.slug)) }))
        .filter((c) => c.stats?.monthly)
        .sort((a, b) => b.stats.monthly.median - a.stats.monthly.median)
        .slice(0, 15)
        .map((c) => ({ slug: c.slug, name: c.name, n: c.stats.n, monthly: c.stats.monthly, annual: c.stats.annual })),
    };
  });

  // 雲端 / 資安 專區: rows count by job title (sectorRole) or by employer (sectorCompany).
  const sectors = SECTORS.map((sec) => {
    const byRole = submissions.filter((s) => s.sectorRole === sec.id);
    const byCompany = submissions.filter((s) => s.sectorCompany === sec.id);
    const rows = [...new Set([...byRole, ...byCompany])];
    // Per company, count only the rows that put it in this sector (華碩 has 81 rows but 1 SRE).
    const perCompany = new Map();
    for (const s of rows) if (s.company) perCompany.set(s.company, [...(perCompany.get(s.company) ?? []), s]);
    return {
      id: sec.id,
      label: sec.label,
      roleStats: summarize(byRole),
      companyStats: summarize(byCompany),
      monthlyValues: monthlyValues(byRole),
      rowIds: rows.map((s) => s.id),
      subRoles: SUB_ROLES[sec.id]
        .map((sub) => {
          const rs = byRole.filter((s) => s.subRole === sub.id);
          return { id: sub.id, label: sub.label, n: rs.length, monthly: monthlyValues(rs), stats: summarize(rs) };
        })
        .filter((s) => s.n > 0),
      companies: [...perCompany.entries()]
        .map(([slug, rs]) => {
          const c = companyList.find((x) => x.slug === slug);
          return { slug, name: c.name, n: rs.length, isSectorCompany: c.sector === sec.id, monthly: monthlyValues(rs), stats: summarize(rs) };
        })
        .sort((a, b) => b.n - a.n),
    };
  });

  // 資訊服務業: listed / OTC companies by 產業別 (30 資訊服務業, 36 數位雲端) with their official
  // pay, plus our own submissions from those companies and known unlisted ones.
  const itCodes = new Set(Object.keys(INDUSTRY_LABELS));
  const slugByOfficialCode = new Map(companyList.filter((c) => c.official).map((c) => [c.official.code, c.slug]));
  const itCompanySlugs = new Set(
    companyList.filter((c) => itCodes.has(c.official?.industry) || COMPANIES_BY_NAME.get(c.name)?.itServices).map((c) => c.slug),
  );
  const itRows = submissions.filter((s) => itCompanySlugs.has(s.company));
  const itServices = {
    mol,
    listed: official
      .filter((o) => itCodes.has(o.industry))
      .map((o) => ({ ...o, industryLabel: INDUSTRY_LABELS[o.industry], slug: slugByOfficialCode.get(o.code) ?? null }))
      .sort((a, b) => b.median - a.median),
    crowd: {
      stats: summarize(itRows),
      monthlyValues: monthlyValues(itRows),
      rowIds: itRows.map((s) => s.id),
      companies: [...itCompanySlugs]
        .map((slug) => {
          const c = companyList.find((x) => x.slug === slug);
          return { slug, name: c.name, n: c.n, stats: c.stats, official: c.official };
        })
        .sort((a, b) => b.n - a.n),
    },
  };

  const companyBySlug = new Map(companyList.map((c) => [c.slug, c]));
  const slugByKnownName = new Map(companyList.filter((c) => c.verified).map((c) => [c.name, c.slug]));
  const slugByRawKey = new Map();
  for (const s of submissions) if (s.company) slugByRawKey.set(normalizeKey(s.companyRaw), s.company);
  const interviews = (await readTab("interviews")).map((r, i) => {
    const company = r[0].trim();
    const salary = r[4].trim() || null;
    const known = aliases.global.get(normalizeKey(company));
    const slug = (known && slugByKnownName.get(known.name)) ?? slugByRawKey.get(normalizeKey(company)) ?? null;
    const monthly = salary?.match(/(\d{4,6})\s*\/\s*月/);
    const months = salary?.match(/保\s*(\d{2})/);
    return {
      id: `iv-${i + 1}`,
      company: slug ? companyBySlug.get(slug).name : company,
      companySlug: slug,
      role: r[1].trim(),
      sector: sectorFromRole(r[1]) ?? known?.sector ?? sectorFromName(company),
      process: scrubComment(r[2].trim()),
      offered: r[3].trim() === "是",
      salary,
      offerMonthly: monthly ? round(Number(monthly[1]) / 10000, 2) : null,
      offerGuaranteedMonths: months ? Number(months[1]) : null,
    };
  });

  const flagCounts = {};
  for (const s of submissions) for (const f of s.flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
  const officialYear = Math.max(0, ...official.map((o) => o.year)) || null;
  const meta = {
    generatedAt: new Date().toISOString(),
    site: SITE,
    sheetId: SHEET_ID,
    minN: MIN_N,
    recentFromYear: RECENT_FROM_YEAR,
    total: submissions.length,
    sources: { sheet: submissions.filter((s) => s.source === "sheet").length, web: submissions.filter((s) => s.source === "web").length },
    namedCompanies: companyList.length,
    anonymousRows: submissions.filter((s) => !s.company).length,
    official: { year: officialYear, companies: official.length, matched: companyList.filter((c) => c.official).length },
    mol: mol ? { year: mol.year, annualYear: mol.annualYear } : null,
    itServices: { listed: itServices.listed.length, crowdRows: itRows.length },
    years: Object.fromEntries(
      [...new Set(submissions.map((s) => s.year ?? "unknown"))].sort().map((y) => [y, submissions.filter((s) => (s.year ?? "unknown") === y).length]),
    ),
    flags: flagCounts,
    levels: LEVEL_BANDS.map(({ id, label }) => ({ id, label })),
    roleLabels: Object.fromEntries([...ROLES, OTHER_ROLE].map((r) => [r.id, r.label])),
    trackLabels: Object.fromEntries(TABS.filter((t) => t.track).map((t) => [t.track, t.label])),
  };

  await writeFile(new URL("submissions.json", OUT_DIR), JSON.stringify(submissions));
  await writeFile(new URL("companies.json", OUT_DIR), JSON.stringify(companyList));
  await writeFile(new URL("tracks.json", OUT_DIR), JSON.stringify(tracks));
  await writeFile(new URL("roles.json", OUT_DIR), JSON.stringify(roles));
  await writeFile(new URL("interviews.json", OUT_DIR), JSON.stringify(interviews));
  await writeFile(new URL("sectors.json", OUT_DIR), JSON.stringify(sectors));
  await writeFile(new URL("it-services.json", OUT_DIR), JSON.stringify(itServices));
  await writeFile(new URL("meta.json", OUT_DIR), JSON.stringify(meta, null, 2));

  // Global search (Ctrl+K) loads this on demand instead of inlining 700+ companies in every page.
  await writeFile(
    new URL("../public/search-index.json", import.meta.url),
    JSON.stringify(
      companyList.map((c) => ({ s: c.slug, n: c.name, e: c.en, a: c.aliases, t: c.track, c: c.n, m: c.stats?.monthly?.median ?? null })),
    ),
  );

  // Open data: aggregates only, never individual rows or comments.
  await writeFile(
    new URL("companies.csv", PUBLIC_DATA_DIR),
    toCsv(
      companyList.filter((c) => c.stats),
      [
        { header: "公司", value: (r) => r.name },
        { header: "英文名", value: (r) => r.en },
        { header: "產業", value: (r) => meta.trackLabels[r.track] },
        ...statColumns,
        { header: "官方非主管薪資中位數(萬)", value: (r) => r.official?.median },
        { header: "官方資料年度", value: (r) => r.official?.year },
      ],
    ),
  );
  await writeFile(
    new URL("roles.csv", PUBLIC_DATA_DIR),
    toCsv(roles.filter((r) => r.stats), [{ header: "職務", value: (r) => r.label }, ...statColumns]),
  );
  await writeFile(
    new URL("industries.csv", PUBLIC_DATA_DIR),
    toCsv(tracks, [{ header: "產業", value: (r) => r.label }, ...statColumns]),
  );
  await writeFile(
    new URL("it-services-listed.csv", PUBLIC_DATA_DIR),
    toCsv(itServices.listed, [
      { header: "代號", value: (r) => r.code },
      { header: "公司", value: (r) => r.name },
      { header: "市場", value: (r) => r.market },
      { header: "產業別", value: (r) => r.industryLabel },
      { header: "年度", value: (r) => r.year },
      { header: "非主管薪資中位數(萬)", value: (r) => r.median },
      { header: "非主管薪資平均數(萬)", value: (r) => r.mean },
      { header: "中位數年增", value: (r) => r.medianChange },
    ]),
  );

  console.log(JSON.stringify({ total: meta.total, sources: meta.sources, official: meta.official, flags: meta.flags }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
