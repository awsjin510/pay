// 勞動部「職類別薪資調查」— 受僱員工人數、每人薪資（按職類別分），one open dataset per 行業大類.
// 政府資料開放授權條款第1版, published every June: July headcount and July 經常性薪資 of the
// survey year, plus the previous calendar year's total pay.
//
// Industry codes follow 行業統計分類第 11 次修正. Major-category names come from the dataset
// titles; only middle categories whose code and meaning are unchanged in later revisions are
// labelled here (the 12th revision reassigned the major letters).
import { readFile, writeFile } from "node:fs/promises";

const BASE = "https://apiservice.mol.gov.tw/OdService/download/";
export const MOL_DATASETS = [
  { letter: "B", label: "礦業及土石採取業", id: "A17000000J-020067-4V3" },
  { letter: "C", label: "製造業", id: "A17000000J-030089-dE0" },
  { letter: "D", label: "電力及燃氣供應業", id: "A17000000J-030090-d2m" },
  { letter: "E", label: "用水供應及污染整治業", id: "A17000000J-030091-end" },
  { letter: "F", label: "營建工程業", id: "A17000000J-030092-TsJ" },
  { letter: "G", label: "批發及零售業", id: "A17000000J-030093-7Yq" },
  { letter: "H", label: "運輸及倉儲業", id: "A17000000J-030094-znx" },
  { letter: "I", label: "住宿及餐飲業", id: "A17000000J-030095-yGC" },
  { letter: "J", label: "出版影音及資通訊業", id: "A17000000J-030096-kNI" },
  { letter: "K", label: "金融及保險業", id: "A17000000J-030097-Cif" },
  { letter: "L", label: "不動產業", id: "A17000000J-030098-Gvn" },
  { letter: "M", label: "專業、科學及技術服務業", id: "A17000000J-030099-PIe" },
  { letter: "N", label: "支援服務業", id: "A17000000J-030100-hxv" },
  { letter: "P", label: "教育業", id: "A17000000J-030101-TIZ" },
  { letter: "Q", label: "醫療保健及社會工作服務業", id: "A17000000J-030102-3v9" },
  { letter: "R", label: "藝術、娛樂及休閒服務業", id: "A17000000J-030103-sCv" },
  { letter: "S", label: "其他服務業", id: "A17000000J-030104-mnq" },
];

// Middle categories worth naming next to tech jobs (codes unchanged across revisions).
const SUB_LABELS = {
  C260000000: "電子零組件製造業",
  C270000000: "電腦、電子產品及光學製品製造業",
  C280000000: "電力設備及配備製造業",
  C290000000: "機械設備製造業",
  J580000000: "出版業",
  J610000000: "電信業",
  J620000000: "電腦程式設計、諮詢及相關服務業",
  J630000000: "資訊服務業",
  K660000000: "證券期貨及金融輔助業",
};

// Industries whose full occupation table is shown, in display order.
export const MOL_INDUSTRIES = [
  { code: "J620000000", label: "電腦程式設計、諮詢及相關服務業" },
  { code: "J630000000", label: "資訊服務業" },
  { code: "J610000000", label: "電信業" },
  { code: "J000000000", label: "出版影音及資通訊業（全體）" },
  { code: "C260000000", label: "電子零組件製造業" },
  { code: "C270000000", label: "電腦、電子產品及光學製品製造業" },
  { code: "K000000000", label: "金融及保險業" },
  { code: "M000000000", label: "專業、科學及技術服務業" },
];

// 職類大類; every other row is a detailed occupation inside the last major group seen.
const MAJOR_GROUPS = new Set([
  "主管及監督人員",
  "專業人員",
  "技術員及助理專業人員",
  "事務支援人員",
  "服務及銷售工作人員",
  "技藝、機械設備操作及組裝人員",
  "基層技術工及勞力工",
]);

export const ICT_PRO = "資訊及通訊專業人員(含系統分析、程式設計、資料庫及網路專業人員)";
export const ICT_TECH = "資訊管理及維護技術員";

// Our role categories → the closest 勞動部 occupation, for the official reference on role pages.
export const ROLE_TO_OCCUPATION = {
  software: ICT_PRO,
  backend: ICT_PRO,
  frontend: ICT_PRO,
  fullstack: ICT_PRO,
  mobile: ICT_PRO,
  devops: ICT_PRO,
  "data-ai": ICT_PRO,
  security: ICT_PRO,
  pm: "專案管理師(含經營管理顧問)",
  management: "中階主管(經理)",
  hardware: "電機、電子工程師",
  sales: "工商業銷售代表(含業務員)",
};

export function occupationReference(mol, occupation) {
  if (!mol || !occupation) return null;
  const rows = mol.industries
    .map((ind) => ({ industry: ind.label, ...ind.occupations.find((o) => o.name === occupation) }))
    .filter((r) => r.monthly != null);
  return rows.length ? { occupation, year: mol.year, annualYear: mol.annualYear, rows } : null;
}

const fileOf = (d) => `mol_${d.letter}.json`;

export async function fetchMol(rawDir) {
  for (const d of MOL_DATASETS) {
    const res = await fetch(BASE + d.id);
    if (!res.ok) throw new Error(`${d.label}: HTTP ${res.status}`);
    await writeFile(new URL(fileOf(d), rawDir), await res.text());
  }
  console.log(`fetched ${MOL_DATASETS.length} 勞動部 occupation datasets`);
}

const field = (row, part) => {
  const key = Object.keys(row).find((k) => k.includes(part));
  return key ? String(row[key]).trim() : "";
};

// "-" = no such workers, "---" = suppressed for confidentiality; both become null.
const numOrNull = (s) => {
  const n = Number(s.replace(/,/g, ""));
  return /^-+$/.test(s) || s === "" || !Number.isFinite(n) ? null : n;
};

function occupationsOf(rows) {
  let group = null;
  const out = [];
  for (const r of rows) {
    const name = field(r, "職類別");
    const major = MAJOR_GROUPS.has(name);
    if (major) group = name;
    const employees = numOrNull(field(r, "受僱員工人數"));
    const monthlyYuan = numOrNull(field(r, "經常性薪資"));
    if (employees == null || monthlyYuan == null) continue;
    out.push({ name, major, group: major ? name : group, employees, monthly: Math.round(monthlyYuan / 100) / 100, annual: numOrNull(field(r, "全年薪資所得")) });
  }
  return out;
}

export async function readMol(rawDir) {
  const byCode = new Map();
  let year = null;
  let annualYear = null;
  for (const d of MOL_DATASETS) {
    let rows;
    try {
      rows = JSON.parse((await readFile(new URL(fileOf(d), rawDir), "utf8")).replace(/^﻿/, ""));
    } catch {
      continue;
    }
    year ??= Number(field(rows[0], "年度")) || null;
    const annualKey = Object.keys(rows[0]).find((k) => k.includes("全年薪資所得")) ?? "";
    annualYear ??= Number(annualKey.match(/(\d{3})年1月/)?.[1] ?? 0) + 1911 || null;
    const codes = [...new Set(rows.map((r) => field(r, "行業別")))];
    for (const code of codes) {
      const label = code === `${d.letter}000000000` ? d.label : SUB_LABELS[code];
      if (!label) continue;
      byCode.set(code, { code, label, major: code === `${d.letter}000000000`, occupations: occupationsOf(rows.filter((r) => field(r, "行業別") === code)) });
    }
  }
  if (!byCode.size) return null;

  const industries = MOL_INDUSTRIES.map((ind) => byCode.get(ind.code) && { ...byCode.get(ind.code), label: ind.label }).filter(Boolean);

  // One IT occupation across every industry that reports it, highest pay first.
  const across = (occupation) =>
    [...byCode.values()]
      .map((ind) => {
        const o = ind.occupations.find((x) => x.name === occupation);
        return o && { code: ind.code, industry: ind.label, major: ind.major, employees: o.employees, monthly: o.monthly, annual: o.annual };
      })
      .filter(Boolean)
      .sort((a, b) => b.monthly - a.monthly);

  return { year, annualYear, industries, itAcross: { pro: across(ICT_PRO), tech: across(ICT_TECH) } };
}
