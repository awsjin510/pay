// Free-text 職務 → role category. First match wins, so specific roles come before generic ones.
const w = (tok) => `(?<![a-z])${tok}(?![a-z])`;
const re = (...parts) => new RegExp(parts.join("|"), "i");

export const ROLES = [
  { id: "management", label: "管理職", re: re("經理", "副理", "協理", "處長", "課長", "部長", "主管", w("manager"), w("director"), w("head"), "技術長", w("cto")) },
  { id: "ic-design", label: "IC 設計", re: re(w("de"), w("dd"), "數位設計", "digital design", "類比", "analog", "layout", "電路設計", "ic設計", "數位ic", w("asic"), w("rtl"), w("apr"), "sipiemc", "si ?pi") },
  { id: "verification", label: "IC 驗證", re: re(w("dv"), "驗證", "verification") },
  { id: "firmware", label: "韌體", re: re("韌體", w("fw"), "fwrd", "firmware", w("bios"), w("bmc")) },
  { id: "hardware", label: "硬體 / 電子", re: re("硬體", w("hw"), "hwrd", w("ee"), "電子", w("rf"), "射頻", "hardware", "電源") },
  { id: "mechanical", label: "機構 / 熱流", re: re("機構", w("me"), "mechanical", "熱流", "thermal", "機械") },
  { id: "app-eng", label: "應用工程 (SA/AE/FAE)", re: re(w("sa"), w("ae"), w("fae"), "應用工程", "系統應用") },
  { id: "qa", label: "測試 / 品保", re: re("測試", w("qa"), w("sqa"), w("te"), "test", "品保", "品質", w("qs")) },
  { id: "pm", label: "PM", re: re(w("pm"), w("bm"), "專案", "產品經理", "program", "product manager") },
  { id: "data-ai", label: "AI / 資料", re: re(w("ai"), w("ml"), "machine learning", "資料", "數據", "data", "演算法", "algorithm", "人工智慧", "影像") },
  { id: "devops", label: "DevOps / SRE / 雲端", re: re(w("sre"), "devops", "維運", "infra", "雲端", "cloud", w("mis"), "網管", w("it")) },
  { id: "security", label: "資安", re: re("資安", "security") },
  { id: "frontend", label: "前端", re: re("前端", "front[ -]?end", w("fe")) },
  { id: "fullstack", label: "全端", re: re("全端", "full[ -]?stack") },
  { id: "backend", label: "後端", re: re("後端", "back[ -]?end", w("server"), w("be")) },
  { id: "mobile", label: "行動 App", re: re(w("ios"), "android", "mobile", "app工程") },
  { id: "software", label: "軟體工程（一般）", re: re("軟體", "軟工", "software", w("swe"), w("sde"), w("se"), w("sw"), "swrd", w("pg"), "程式", "developer", "\\.net", w("java"), "系統分析", w("sd"), "architect", "架構師") },
  { id: "sales", label: "業務", re: re("業務", "sales") },
  // Titles that are really levels (高工, 主任, 專員) carry no discipline, so they land here too.
  { id: "rd-general", label: "研發（未細分）", re: re(w("rd"), "r&d", "研發", "工程師", "engineer", "工程", "高工", "主任", "專員", "研究員", "開發") },
];

export const OTHER_ROLE = { id: "other", label: "其他" };

export function classifyRole(raw, track) {
  const text = raw.normalize("NFKC").toLowerCase();
  const hit = ROLES.find((r) => r.re.test(text));
  if (!hit) return OTHER_ROLE;
  // In 純軟, a bare "RD / 工程師" is a software engineer.
  if (hit.id === "rd-general" && track === "soft") return ROLES.find((r) => r.id === "software");
  return hit;
}

// 職級 strings are company-internal (E7, L4, 6, 高工 …), so cross-company comparison uses
// 相關年資 bands instead.
export const LEVEL_BANDS = [
  { id: "entry", label: "新鮮人（0–1 年）", max: 2 },
  { id: "junior", label: "初中階（2–4 年）", max: 5 },
  { id: "senior", label: "資深（5–9 年）", max: 10 },
  { id: "expert", label: "專家 / 主管（10 年+）", max: Infinity },
];

export function levelBand(yoe) {
  if (yoe == null) return null;
  return LEVEL_BANDS.find((b) => yoe < b.max).id;
}
