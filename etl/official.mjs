// 公開資訊觀測站「非擔任主管職務之全時員工薪資」— the legally required disclosure for listed
// (上市, TWSE) and OTC (上櫃, TPEx) companies, published every June for the previous year.
import { readFile, writeFile } from "node:fs/promises";

const SOURCES = [
  { file: "official_twse.json", market: "上市", url: "https://openapi.twse.com.tw/v1/opendata/t187ap46_L_5" },
  { file: "official_tpex.json", market: "上櫃", url: "https://www.tpex.org.tw/openapi/v1/t187ap46_O_5" },
];

export async function fetchOfficial(rawDir) {
  for (const s of SOURCES) {
    const res = await fetch(s.url);
    if (!res.ok) throw new Error(`${s.url}: HTTP ${res.status}`);
    await writeFile(new URL(s.file, rawDir), await res.text());
    console.log(`fetched ${s.file}`);
  }
}

// Field names carry stray trailing spaces in the TWSE feed, so look them up by fragment.
const field = (row, ...parts) => {
  const key = Object.keys(row).find((k) => parts.every((p) => k.includes(p)));
  return key ? String(row[key]).trim() : "";
};

const thousandsToWan = (s) => {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) / 10 : null;
};

export async function readOfficial(rawDir) {
  const out = [];
  for (const s of SOURCES) {
    let rows;
    try {
      rows = JSON.parse(await readFile(new URL(s.file, rawDir), "utf8"));
    } catch {
      continue;
    }
    for (const r of rows) {
      const median = thousandsToWan(field(r, "非擔任主管", "中位數(仟元"));
      if (median == null) continue;
      out.push({
        code: field(r, "公司代號"),
        name: field(r, "公司名稱"),
        market: s.market,
        year: Number(field(r, "報告年度")) + 1911,
        median,
        mean: thousandsToWan(field(r, "非擔任主管", "平均數(仟元")),
        medianChange: field(r, "非擔任主管", "中位數變動"),
      });
    }
  }
  return out;
}
