// 雲端 / 資安 classification by job title. Stricter than the role taxonomy's devops bucket,
// which also holds generic IT / MIS titles.
const SECURITY_ROLE = /資安|資訊安全|網安|security|(?<![a-z])soc(?![a-z])|紅隊|藍隊|滲透|pentest|威脅/i;
const CLOUD_ROLE = /(?<![a-z])sre(?![a-z])|devops|dev ops|雲端|cloud|維運|infra|platform|k8s|kubernetes|(?<![a-z])(aws|gcp|azure)(?![a-z])/i;

export const SECTORS = [
  { id: "cloud", label: "雲端 / DevOps / SRE" },
  { id: "security", label: "資安" },
];

export function sectorFromRole(raw) {
  if (SECURITY_ROLE.test(raw)) return "security";
  if (CLOUD_ROLE.test(raw)) return "cloud";
  return null;
}

// Finer split inside each sector; first match wins.
export const SUB_ROLES = {
  cloud: [
    { id: "sre", label: "SRE", re: /(?<![a-z])sre(?![a-z])|reliability/i },
    { id: "cloud-arch", label: "雲端架構師", re: /架構|architect|solution/i },
    { id: "cloud-support", label: "雲端技術支援", re: /support|支援/i },
    { id: "devops", label: "DevOps / Platform", re: /devops|dev ops|platform|infra|k8s|kubernetes/i },
    { id: "ops", label: "維運", re: /維運|運維|ops/i },
    { id: "cloud-other", label: "其他雲端職務", re: /./ },
  ],
  security: [
    { id: "research", label: "資安研究員", re: /研究|research/i },
    { id: "red-team", label: "紅隊 / 滲透測試", re: /紅隊|滲透|pentest|red ?team/i },
    { id: "soc", label: "SOC / 藍隊", re: /(?<![a-z])soc(?![a-z])|藍隊|監控|blue ?team/i },
    { id: "grc", label: "GRC / 資安顧問", re: /grc|顧問|稽核|合規|治理|consult/i },
    { id: "sec-eng", label: "資安工程師", re: /./ },
  ],
};

export function subRole(sector, raw) {
  return SUB_ROLES[sector]?.find((s) => s.re.test(raw)) ?? null;
}
