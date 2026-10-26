// 勞動部「職類別薪資調查」— 受僱員工人數、每人薪資：出版影音及資通訊業（按職類別分）.
// Open data (政府資料開放授權條款第1版), published every June: July headcount and July
// 經常性薪資 of the survey year, plus the previous calendar year's total pay.
import { readFile, writeFile } from "node:fs/promises";

const FILE = "mol_ict.json";
const URL_JSON = "https://apiservice.mol.gov.tw/OdService/download/A17000000J-030096-kNI";

// 行業標準分類第 11 次修正, 大類 J.
export const MOL_INDUSTRIES = [
  { code: "J000000000", label: "出版影音及資通訊業（全體）" },
  { code: "J620000000", label: "電腦程式設計、諮詢及相關服務業" },
  { code: "J630000000", label: "資料處理及資訊供應服務業" },
  { code: "J610000000", label: "電信業" },
  { code: "J580000000", label: "出版業" },
  { code: "J590000000", label: "影片服務、聲音錄製及音樂發行業" },
  { code: "J600000000", label: "傳播及節目播送業" },
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

// Our role categories → the closest 勞動部 occupation, for the official reference on role pages.
const ICT_PRO = "資訊及通訊專業人員(含系統分析、程式設計、資料庫及網路專業人員)";
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

export async function fetchMol(rawDir) {
  const res = await fetch(URL_JSON);
  if (!res.ok) throw new Error(`${URL_JSON}: HTTP ${res.status}`);
  await writeFile(new URL(FILE, rawDir), await res.text());
  console.log(`fetched ${FILE}`);
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

export async function readMol(rawDir) {
  let rows;
  try {
    rows = JSON.parse((await readFile(new URL(FILE, rawDir), "utf8")).replace(/^﻿/, ""));
  } catch {
    return null;
  }
  const annualKey = Object.keys(rows[0]).find((k) => k.includes("全年薪資所得")) ?? "";
  const annualYear = Number(annualKey.match(/(\d{3})年1月/)?.[1] ?? 0) + 1911 || null;
  const year = Number(field(rows[0], "年度")) || null;

  const industries = MOL_INDUSTRIES.map((ind) => {
    let group = null;
    const occupations = [];
    for (const r of rows.filter((x) => field(x, "行業別") === ind.code)) {
      const name = field(r, "職類別");
      const major = MAJOR_GROUPS.has(name);
      if (major) group = name;
      const employees = numOrNull(field(r, "受僱員工人數"));
      const monthlyYuan = numOrNull(field(r, "經常性薪資"));
      if (employees == null || monthlyYuan == null) continue;
      occupations.push({
        name,
        major,
        group: major ? name : group,
        employees,
        monthly: Math.round(monthlyYuan / 100) / 100,
        annual: numOrNull(field(r, "全年薪資所得")),
      });
    }
    return { ...ind, occupations };
  });
  return { year, annualYear, industries };
}
