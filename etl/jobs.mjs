// 台灣就業通 open job listings (勞動部勞動力發展署, 政府資料開放授權條款第1版): the IT category
// (職務大類 08 資訊／軟體／系統). Each request returns at most 1,000 openings per 職務小類 code.
import { readFile, writeFile } from "node:fs/promises";

const FILE = "jobs_it.json";
const ENDPOINT = "https://free.taiwanjobs.gov.tw/webservice_taipei/Webservice.ashx";
// Every 職務小類 code under 08; codes with no openings simply return nothing.
const CODES = ["0801", "0802", "0803"].flatMap((p) => [...Array.from({ length: 12 }, (_, i) => p + String(i + 1).padStart(2, "0")), p + "90"]);

const tag = (block, name) => block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`))?.[1]?.trim() ?? "";

function parse(xml) {
  return [...xml.matchAll(/<Data>([\s\S]*?)<\/Data>/g)].map(([, b]) => ({
    title: tag(b, "OCCU_DESC"),
    type: tag(b, "WK_TYPE"),
    categoryCode: tag(b, "CJOB2_COUNT"),
    category: tag(b, "CJOB_NAME2"),
    openings: Number(tag(b, "JOB_PERSON")) || 1,
    deadline: tag(b, "STOP_DATE"),
    city: tag(b, "CITYNAME"),
    experience: tag(b, "EXPERIENCE"),
    payType: tag(b, "SALARYCD"),
    salaryLow: Number(tag(b, "NT_L")) || null,
    salaryHigh: Number(tag(b, "NT_U")) || null,
    education: tag(b, "EDGRDESC"),
    url: tag(b, "URL_QUERY"),
    company: tag(b, "COMPNAME"),
    updated: tag(b, "TRANDATE"),
  }));
}

export async function fetchJobs(rawDir) {
  const all = [];
  for (const code of CODES) {
    const res = await fetch(`${ENDPOINT}?jobno=${code}&count=1000`);
    if (!res.ok) throw new Error(`台灣就業通 ${code}: HTTP ${res.status}`);
    all.push(...parse(await res.text()));
  }
  await writeFile(new URL(FILE, rawDir), JSON.stringify(all));
  console.log(`fetched ${all.length} 台灣就業通 IT openings`);
}

const toDate = (s) => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

export async function readJobs(rawDir, today) {
  let raw;
  try {
    raw = JSON.parse(await readFile(new URL(FILE, rawDir), "utf8"));
  } catch {
    return null;
  }
  // Full-time, still open, with a monthly salary figure; 時薪/日薪 and 面議 can't be compared.
  const seen = new Set();
  const jobs = raw
    .map((j) => ({ ...j, deadline: toDate(j.deadline), updated: toDate(j.updated) }))
    .filter((j) => (!j.deadline || j.deadline >= today) && j.type.includes("全職"))
    .filter((j) => {
      const key = `${j.company}|${j.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((j) => {
      const monthly = /月薪/.test(j.payType) && j.salaryLow;
      return {
        ...j,
        // 萬, one decimal
        low: monthly ? Math.round(j.salaryLow / 1000) / 10 : null,
        high: monthly && j.salaryHigh ? Math.round(j.salaryHigh / 1000) / 10 : null,
        negotiable: /依學經歷/.test(j.payType),
      };
    })
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));
  return jobs;
}
