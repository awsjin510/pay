// Fetch the 薪資紀錄 Google Sheet, clean it, and write data/*.json for the site.
//
//   node etl/build.mjs           # use cached CSVs in data/raw
//   node etl/build.mjs --fetch   # re-download from Google Sheets first
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseCsv } from "./csv.mjs";
import { ANONYMOUS_PATTERNS, buildAliasIndex, normalizeKey } from "./companies.mjs";
import { classifyRole, LEVEL_BANDS, levelBand, ROLES, OTHER_ROLE } from "./roles.mjs";

const SHEET_ID = "1-lMc-QktDGlO05je0zyR7P7QnfuoaECcsGUeKZZy6q0";
const TABS = [
  { file: "interviews", gid: "0" },
  { file: "soft", gid: "819754168", track: "soft", label: "純軟" },
  { file: "system", gid: "37329018", track: "system", label: "系統廠" },
  { file: "ic", gid: "1298005689", track: "ic", label: "IC 設計" },
];
// Fewer submissions than this and a company/role shows no aggregate numbers.
const MIN_N = 3;
const RECENT_FROM_YEAR = 2025;
const TODAY = new Date().toISOString().slice(0, 10);

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const OUT_DIR = new URL("../data/", import.meta.url);

async function fetchTabs() {
  await mkdir(RAW_DIR, { recursive: true });
  for (const tab of TABS) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${tab.gid}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${tab.file}: HTTP ${res.status}`);
    await writeFile(new URL(`${tab.file}.csv`, RAW_DIR), await res.text());
    console.log(`fetched ${tab.file}`);
  }
}

// ── field cleaners ──────────────────────────────────────────────

function num(s) {
  const t = s.trim().replace(/,/g, "");
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
  const t = raw.trim();
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
  const m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const date = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  if (date > TODAY) {
    flags.push("future_date");
    return null;
  }
  return date;
}

// Person-directed insults and unverified factual accusations. Plain negative opinions
// ("不推", "爛公司", "幹話") are fine and are not matched.
const HARSH = /智商|智障|白癡|白痴|垃圾(老人|主管|同事|老闆)|廢物(長官|主管|老闆)|腦殘|低能|無腦人|很笨|米蟲|臭魚爛蝦|亂咬人|罵三字經|騙騙?客戶|沒路用|舔上級/;

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

function summarize(rows) {
  if (rows.length < MIN_N) return null;
  return {
    n: rows.length,
    monthly: dist(rows.map((r) => r.monthly), 1),
    annual: dist(rows.map((r) => r.annual ?? r.annualEstimate), 0),
    bonusMonths: dist(rows.map((r) => r.bonusMonths), 1),
    hoursPerDay: dist(rows.map((r) => r.hoursPerDay), 1),
    overtimePerMonth: dist(rows.map((r) => r.overtimePerMonth), 0),
    happiness: mean(rows.map((r) => r.happiness)),
    loading: mean(rows.map((r) => r.loading)),
    overtimeFreq: mean(rows.map((r) => r.overtimeFreq)),
    recentN: rows.filter((r) => r.year >= RECENT_FROM_YEAR).length,
    byLevel: LEVEL_BANDS.map((b) => {
      const sub = rows.filter((r) => r.level === b.id);
      return { level: b.id, n: sub.length, monthly: dist(sub.map((r) => r.monthly), 1), annual: dist(sub.map((r) => r.annual ?? r.annualEstimate), 0) };
    }),
  };
}

// ── main ───────────────────────────────────────────────────────

async function readTab(file) {
  const rows = parseCsv(await readFile(new URL(`${file}.csv`, RAW_DIR), "utf8"));
  return rows.slice(1).filter((r) => r.some((c) => c.trim()));
}

async function main() {
  if (process.argv.includes("--fetch")) await fetchTabs();
  const aliases = buildAliasIndex();
  const submissions = [];
  const companies = new Map();
  const rawNameCounts = new Map();

  for (const tab of TABS.filter((t) => t.track)) {
    for (const [i, r] of (await readTab(tab.file)).entries()) {
      const flags = [];
      const rawCompany = r[1].trim();
      const key = normalizeKey(rawCompany);
      const known = aliases.scoped[tab.track].get(key) ?? aliases.global.get(key);
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

      const monthly = cleanMonthly(r[6], flags);
      const bonusMonths = cleanBonus(r[7], flags);
      const annual = cleanAnnual(r[8], flags);
      const annualEstimate = annual == null && monthly != null && bonusMonths != null ? round(monthly * (12 + bonusMonths), 1) : null;
      if (annualEstimate != null) flags.push("annual_estimated");
      // 總年薪 includes 分紅, so it may legitimately exceed 月薪×(12+Bonus); only a total below
      // twelve months of base pay, or more than 4× the estimate, is implausible.
      if (annual != null && monthly != null) {
        const base12 = monthly * 12;
        const est = monthly * (12 + (bonusMonths ?? 0));
        if (annual < base12 * 0.9) flags.push("annual_below_base");
        else if (annual > est * 4) flags.push("annual_far_above_estimate");
      }
      const yoe = inRange(r[4], 0, 50);
      const date = cleanDate(r[0], flags);
      const role = classifyRole(r[2], tab.track);
      const comment = r[14].trim();
      const harsh = HARSH.test(comment);
      if (harsh) flags.push("comment_harsh");

      const row = {
        id: `${tab.track}-${i + 1}`,
        track: tab.track,
        companyKey,
        companyRaw: rawCompany,
        roleRaw: r[2].trim(),
        role: role.id,
        levelRaw: r[3].trim(),
        level: levelBand(yoe),
        yoe,
        yoeCurrent: inRange(r[5], 0, 50),
        monthly,
        bonusMonths,
        annual,
        annualEstimate,
        hoursPerDay: inRange(r[9], 1, 16),
        overtimePerMonth: inRange(r[10], 0, 250),
        overtimeFreq: inRange(r[11], 1, 5),
        happiness: inRange(r[12], 1, 5),
        loading: inRange(r[13], 1, 5),
        // Hidden comments are dropped from the published data, not just hidden in the UI.
        comment: harsh ? null : comment || null,
        commentHidden: harsh,
        date,
        year: date ? Number(date.slice(0, 4)) : null,
        flags,
      };
      submissions.push(row);
      if (companyKey) {
        const c = companies.get(companyKey);
        c.rows.push(row);
        c.tracks.set(tab.track, (c.tracks.get(tab.track) ?? 0) + 1);
      }
    }
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
    companyList.push({
      slug,
      name,
      en: c.known?.en ?? null,
      track,
      verified: Boolean(c.known),
      aliases: rawNames.map(([n]) => n).filter((n) => n !== name),
      n: c.rows.length,
      latest: c.rows.map((r) => r.date).filter(Boolean).sort().at(-1) ?? null,
      stats: summarize(c.rows),
      recentStats: summarize(c.rows.filter((r) => r.year >= RECENT_FROM_YEAR)),
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
      roles: [...ROLES, OTHER_ROLE]
        .map((r) => ({ role: r.id, stats: summarize(rows.filter((s) => s.role === r.id)) }))
        .filter((r) => r.stats),
    };
  });

  const roles = [...ROLES, OTHER_ROLE].map((r) => {
    const rows = submissions.filter((s) => s.role === r.id);
    return {
      id: r.id,
      label: r.label,
      stats: summarize(rows),
      byTrack: TABS.filter((t) => t.track).map((t) => ({ track: t.track, stats: summarize(rows.filter((s) => s.track === t.track)) })),
      topCompanies: companyList
        .map((c) => ({ slug: c.slug, name: c.name, stats: summarize(rows.filter((s) => s.company === c.slug)) }))
        .filter((c) => c.stats?.monthly)
        .sort((a, b) => b.stats.monthly.median - a.stats.monthly.median)
        .slice(0, 15)
        .map((c) => ({ slug: c.slug, name: c.name, n: c.stats.n, monthly: c.stats.monthly, annual: c.stats.annual })),
    };
  });

  const interviews = (await readTab("interviews")).map((r, i) => ({
    id: `iv-${i + 1}`,
    company: r[0].trim(),
    role: r[1].trim(),
    process: r[2].trim(),
    offered: r[3].trim() === "是",
    salary: r[4].trim() || null,
  }));

  const flagCounts = {};
  for (const s of submissions) for (const f of s.flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
  const meta = {
    generatedAt: new Date().toISOString(),
    sheetId: SHEET_ID,
    minN: MIN_N,
    recentFromYear: RECENT_FROM_YEAR,
    total: submissions.length,
    namedCompanies: companyList.length,
    anonymousRows: submissions.filter((s) => !s.company).length,
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
  await writeFile(new URL("meta.json", OUT_DIR), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
