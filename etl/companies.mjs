// Canonical companies and their aliases.
//
// Nickname mappings were verified on 2026-10-26 against PTT Stock「PTT 上的公司綽號」
// (https://www.ptt.cc/bbs/Stock/M.1603384590.A.07B.html), 工商時報 2026-02-12 外號盤點
// (https://www.ctee.com.tw/news/20260212700011-430502) and note.artchiu.org「PTT 企業綽號列表」.
// `scoped` aliases only apply inside one track, because single letters like "M" or "P"
// mean different companies in different industries.
//
// Deliberately NOT mapped (unverified or conflicting): 寶寶 (仁寶 / 泰金寶 / 賀寶芙),
// 三角, 小W / W, 恐龍, 微便宜, 正海, 綠色滷肉, N, R, X. They stay as their raw names.

export const COMPANIES = [
  // ── IC 設計 ──
  { name: "聯發科", en: "MediaTek", track: "ic", aliases: ["聯發科技", "MTK", "MediaTek", "發哥", "大M"], scoped: { ic: ["M"] } },
  { name: "瑞昱", en: "Realtek", track: "ic", aliases: ["瑞昱半導體", "Realtek", "RTK", "螃蟹", "帝王蟹", "海產店"], scoped: { ic: ["海產"] } },
  { name: "聯詠", en: "Novatek", track: "ic", aliases: ["聯詠科技", "Novatek", "Nova", "滷肉"] },
  { name: "群聯", en: "Phison", track: "ic", aliases: ["群聯電子", "Phison", "竹南P"], scoped: { ic: ["P"] } },
  { name: "奇景光電", en: "Himax", track: "ic", aliases: ["奇景", "Himax", "海馬"] },
  { name: "瑞鼎", en: "Raydium", track: "ic", aliases: ["瑞鼎科技", "Raydium", "鼎王"] },
  { name: "敦泰", en: "FocalTech", track: "ic", aliases: ["敦泰電子", "FocalTech"], scoped: { ic: ["保全"] } },
  { name: "立錡", en: "Richtek", track: "ic", aliases: ["立錡科技", "Richtek", "Rich", "小螃蟹"] },
  { name: "慧榮", en: "Silicon Motion", track: "ic", aliases: ["慧榮科技", "SMI", "Silicon Motion"] },
  { name: "創意電子", en: "GUC", track: "ic", aliases: ["創意", "GUC"] },
  { name: "智原", en: "Faraday", track: "ic", aliases: ["智原科技", "Faraday"] },
  { name: "新唐", en: "Nuvoton", track: "ic", aliases: ["新唐科技", "Nuvoton"] },
  { name: "義隆電子", en: "ELAN", track: "ic", aliases: ["義隆", "ELAN"] },
  { name: "晶心科技", en: "Andes", track: "ic", aliases: ["晶心", "Andes", "Andes Technology"] },
  { name: "高通", en: "Qualcomm", track: "ic", aliases: ["Qualcomm", "Qcom"] },
  { name: "輝達", en: "NVIDIA", track: "ic", aliases: ["NVIDIA", "NV", "NVDIA"] },
  { name: "AMD", en: "AMD", track: "ic", aliases: ["超微"] },

  // ── 系統廠 / 硬體 ──
  { name: "鴻海", en: "Foxconn", track: "system", aliases: ["鴻海精密", "鴻海精密工業", "Foxconn", "富士康", "海邊", "大海邊"] },
  { name: "廣達", en: "Quanta", track: "system", aliases: ["廣達電腦", "Quanta", "肉鬆"] },
  { name: "華碩", en: "ASUS", track: "system", aliases: ["ASUS", "石頭", "石頭店"] },
  { name: "仁寶", en: "Compal", track: "system", aliases: ["仁寶電腦", "仁寶電腦工業", "Compal", "Compal仁寶"] },
  { name: "和碩", en: "Pegatron", track: "system", aliases: ["和碩聯合科技", "和碩聯合科技公司", "Pegatron", "PEGA", "皮卡", "皮卡丘"] },
  { name: "英業達", en: "Inventec", track: "system", aliases: ["Inventec", "小英"] },
  { name: "緯創", en: "Wistron", track: "system", aliases: ["緯創資通", "Wistron", "Wisteon"] },
  { name: "緯穎", en: "Wiwynn", track: "system", aliases: ["Wiwynn"] },
  { name: "啟碁", en: "WNC", track: "system", aliases: ["啟碁科技", "WNC"] },
  { name: "台達電", en: "Delta", track: "system", aliases: ["台達", "台達電子", "Delta", "Delta electronic", "Delta Electronics"] },
  { name: "四零四科技", en: "Moxa", track: "system", aliases: ["Moxa", "404", "四零四"] },
  { name: "研華", en: "Advantech", track: "system", aliases: ["研華科技", "Advantech"] },
  { name: "宏碁", en: "Acer", track: "system", aliases: ["Acer"] },
  { name: "微星", en: "MSI", track: "system", aliases: ["MSI", "微星科技"] },
  { name: "佳世達", en: "Qisda", track: "system", aliases: ["Qisda"] },
  { name: "智邦", en: "Accton", track: "system", aliases: ["智邦科技", "Accton"] },
  { name: "光寶", en: "Lite-On", track: "system", aliases: ["光寶科技", "光寶科", "Liteon", "Lite-On"] },
  { name: "友達", en: "AUO", track: "system", aliases: ["友達光電", "AUO", "戀人"] },
  { name: "群創", en: "Innolux", track: "system", aliases: ["群創光電", "Innolux", "包子"] },
  { name: "神達", en: "MiTAC", track: "system", aliases: ["神達電腦", "MiTAC"] },
  { name: "聯寶", en: "LCFC", track: "system", aliases: ["聯寶電子", "LCFC"] },
  { name: "環鴻", en: "USI", track: "system", aliases: ["環鴻科技"] },
  { name: "新代科技", en: "Syntec", track: "system", aliases: ["新代", "Syntec"] },
  { name: "建興儲存科技", en: "Solid State Storage", track: "system", aliases: ["建興儲存"] },
  { name: "冠捷科技", en: "TPV", track: "system", aliases: ["冠捷", "TPV"] },
  { name: "Garmin", en: "Garmin", track: "system", aliases: ["台灣國際航電"] },
  // The listed company 惠普 (8424) is unrelated to HP, so never attach its official figures.
  { name: "HP", en: "HP", track: "system", official: false, aliases: ["HP Inc.", "HP Inc", "惠普"] },
  { name: "Dell", en: "Dell", track: "system", aliases: [] },

  // ── 純軟 ──
  { name: "趨勢科技", en: "Trend Micro", track: "soft", sector: "security", aliases: ["趨勢", "Trend Micro", "TrendMicro", "TrendMicro趨勢科技"] },
  { name: "睿控網安", en: "TXOne Networks", track: "soft", sector: "security", aliases: ["TXOne", "TXOne Network", "TXOne Networks 睿控網安"] },
  { name: "杜浦數位安全", en: "TeamT5", track: "soft", sector: "security", aliases: ["TeamT5", "TeamT5 杜浦數位安全", "杜浦"] },
  { name: "奧義智慧科技", en: "CyCraft", track: "soft", sector: "security", aliases: ["奧義智慧", "奧義", "CyCraft"] },
  { name: "中華資安國際", en: "CHT Security", track: "soft", sector: "security", aliases: ["中華資安"] },
  { name: "戴夫寇爾", en: "DEVCORE", track: "soft", sector: "security", aliases: ["DEVCORE"] },
  { name: "博弘雲端", en: "Nextlink", track: "soft", sector: "cloud", aliases: ["博弘雲端科技", "Nextlink"] },
  { name: "伊雲谷", en: "eCloudvalley", track: "soft", sector: "cloud", aliases: ["eCloudvalley", "ecloudvxxxxx"] },
  { name: "Google", en: "Google", track: "soft", aliases: ["Google Taiwan", "Google Taipei", "谷歌"] },
  { name: "微軟", en: "Microsoft", track: "soft", aliases: ["Microsoft"] },
  { name: "新思科技", en: "Synopsys", track: "soft", aliases: ["Synopsys", "Synopsis", "Synopsys 新思", "Synopsys新思", "新思"] },
  { name: "群暉", en: "Synology", track: "soft", aliases: ["群暉科技", "Synology"] },
  { name: "威聯通", en: "QNAP", track: "soft", aliases: ["QNAP", "威聯通科技"] },
  { name: "IBM", en: "IBM", track: "soft", aliases: [] },
  { name: "沛星", en: "Appier", track: "soft", aliases: ["沛星互動", "Appier"] },
  { name: "精誠資訊", en: "Systex", track: "soft", aliases: ["精誠", "Systex", "Systex精誠"] },
  { name: "昕力資訊", en: "TPIsoftware", track: "soft", aliases: ["昕力"] },
  { name: "叡揚資訊", en: "Gss", track: "soft", aliases: ["叡揚"] },
  { name: "訊連科技", en: "CyberLink", track: "soft", aliases: ["訊連", "CyberLink"] },
  { name: "KKCompany", en: "KKCompany", track: "soft", aliases: ["KKBOX"] },
  { name: "玉山銀行", en: "E.SUN Bank", track: "soft", aliases: ["玉山"] },
  { name: "國泰世華銀行", en: "Cathay United Bank", track: "soft", aliases: ["國泰世華"] },
  { name: "中華電信", en: "Chunghwa Telecom", track: "soft", aliases: ["中華電"] },
  { name: "台灣大哥大", en: "Taiwan Mobile", track: "soft", aliases: ["台灣大", "台哥大"] },
  { name: "網家", en: "PChome", track: "soft", aliases: ["PChome", "pchome網家", "PChome網家"] },
  { name: "Yahoo", en: "Yahoo", track: "soft", aliases: [] },
  { name: "Amazon", en: "Amazon", track: "soft", aliases: ["AWS"] },
  { name: "Netskope", en: "Netskope", track: "soft", sector: "security", aliases: [] },
  { name: "愛酷智能", en: "Accuhit", track: "soft", aliases: ["愛酷智能科技", "愛酷智能 (accuhit)"] },
  { name: "Shoalter", en: "Shoalter", track: "soft", aliases: ["Shoalter Technology"] },
  { name: "Innova Solutions", en: "Innova Solutions", track: "soft", aliases: ["innovasolutions", "Innova"] },
];

// Entries that name no specific company: 新創, 某XX, 外商, 豬屎屋, 二線 …
export const ANONYMOUS_PATTERNS = [
  /某/, /^新創(公司)?$/, /^(外商|美商|德商|日商|陸商|台商)$/, /^傳產/, /^電商$/, /豬屎屋/, /二線/, /台元科技/,
  /博弈|博奕|菠菜/, /^餐飲$/, /^無$/, /^X$/i, /^[A-Za-z]$/, /^[\p{P}\p{S}\s]*$/u, /^\d{1,3}$/,
];

// Companies outside COMPANIES whose own name says they are a cloud / security business.
export function sectorFromName(raw) {
  if (/資安|網安|security|secure/i.test(raw)) return "security";
  if (/雲端|cloud|(?<![a-z])(aws|gcp|azure)(?![a-z])/i.test(raw)) return "cloud";
  return null;
}

const SUFFIXES = /(股份有限公司|有限公司|公司)$/;

// Lowercase, drop whitespace / parenthesised notes / legal suffixes so "研華科技 (Advantech)"
// and "研華科技" collide.
export function normalizeKey(raw) {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[(（][^)）]*[)）]/g, "")
    .replace(/[\s ]+/g, "")
    .replace(SUFFIXES, "")
    .trim();
}

export function buildAliasIndex() {
  const global = new Map();
  const scoped = { soft: new Map(), system: new Map(), ic: new Map() };
  for (const c of COMPANIES) {
    for (const a of [c.name, c.en, ...c.aliases]) {
      if (a) global.set(normalizeKey(a), c);
    }
    for (const [track, list] of Object.entries(c.scoped ?? {})) {
      for (const a of list) scoped[track].set(normalizeKey(a), c);
    }
  }
  return { global, scoped };
}
