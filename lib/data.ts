import companiesJson from "@/data/companies.json";
import interviewsJson from "@/data/interviews.json";
import itServicesJson from "@/data/it-services.json";
import metaJson from "@/data/meta.json";
import rolesJson from "@/data/roles.json";
import sectorsJson from "@/data/sectors.json";
import submissionsJson from "@/data/submissions.json";
import tracksJson from "@/data/tracks.json";

export type TrackId = "soft" | "system" | "ic";

export type Dist = { n: number; p25: number; median: number; p75: number };

export type LevelStats = { level: string; n: number; monthly: Dist | null; annual: Dist | null };

export type Stats = {
  n: number;
  monthly: Dist | null;
  annual: Dist | null;
  bonusMonths: Dist | null;
  hoursPerDay: Dist | null;
  overtimePerMonth: Dist | null;
  happiness: number | null;
  loading: number | null;
  overtimeFreq: number | null;
  recentN: number;
  years: Record<string, number>;
  byLevel: LevelStats[];
};

export type Official = {
  code: string;
  name: string;
  market: string;
  // 證交所產業別 code, e.g. "30" 資訊服務業, "36" 數位雲端.
  industry: string | null;
  year: number;
  median: number;
  mean: number | null;
  medianChange: string;
};

export type SectorId = "cloud" | "security";

export type Company = {
  slug: string;
  name: string;
  en: string | null;
  track: TrackId;
  sector: SectorId | null;
  verified: boolean;
  aliases: string[];
  n: number;
  latest: string | null;
  official: Official | null;
  stats: Stats | null;
  recentStats: Stats | null;
  monthlyValues: number[];
};

export type Submission = {
  id: string;
  source: "sheet" | "web";
  track: TrackId;
  company?: string;
  companyRaw: string;
  // null when the title was unique in the dataset and merged into its category.
  roleRaw: string | null;
  role: string;
  sectorRole: SectorId | null;
  subRole: string | null;
  sectorCompany: SectorId | null;
  levelRaw: string | null;
  certifications: string | null;
  interviewTopics: string | null;
  level: string | null;
  yoe: number | null;
  yoeCurrent: number | null;
  monthly: number | null;
  bonusMonths: number | null;
  annual: number | null;
  annualEstimate: number | null;
  hoursPerDay: number | null;
  overtimePerMonth: number | null;
  overtimeFreq: number | null;
  happiness: number | null;
  loading: number | null;
  comment: string | null;
  commentHidden: boolean;
  date: string | null;
  year: number | null;
  flags: string[];
};

export type Track = {
  id: TrackId;
  label: string;
  stats: Stats | null;
  recentStats: Stats | null;
  monthlyValues: number[];
  roles: { role: string; stats: Stats }[];
};

// 勞動部職類別薪資調查: one occupation's numbers across industries.
export type OccupationRef = {
  occupation: string;
  year: number;
  annualYear: number;
  rows: { industry: string; employees: number; monthly: number; annual: number | null }[];
};

export type MolOccupation = { name: string; major: boolean; group: string | null; employees: number; monthly: number; annual: number | null };

export type ItServices = {
  mol: { year: number; annualYear: number; industries: { code: string; label: string; occupations: MolOccupation[] }[] } | null;
  listed: (Official & { industryLabel: string; slug: string | null })[];
  crowd: {
    stats: Stats | null;
    monthlyValues: number[];
    rowIds: string[];
    companies: { slug: string; name: string; n: number; stats: Stats | null; official: Official | null }[];
  };
};

export type Role = {
  id: string;
  label: string;
  stats: Stats | null;
  officialRef: OccupationRef | null;
  monthlyValues: number[];
  byTrack: { track: TrackId; stats: Stats | null }[];
  topCompanies: { slug: string; name: string; n: number; monthly: Dist | null; annual: Dist | null }[];
};

export type Interview = {
  id: string;
  company: string;
  companySlug: string | null;
  role: string;
  sector: SectorId | null;
  process: string;
  offered: boolean;
  salary: string | null;
  offerMonthly: number | null;
  offerGuaranteedMonths: number | null;
};

export type Sector = {
  id: SectorId;
  label: string;
  roleStats: Stats | null;
  companyStats: Stats | null;
  monthlyValues: number[];
  rowIds: string[];
  subRoles: { id: string; label: string; n: number; monthly: number[]; stats: Stats | null }[];
  companies: { slug: string; name: string; n: number; isSectorCompany: boolean; monthly: number[]; stats: Stats | null }[];
};

export const companies = companiesJson as unknown as Company[];
export const submissions = submissionsJson as unknown as Submission[];
export const tracks = tracksJson as unknown as Track[];
export const roles = rolesJson as unknown as Role[];
export const interviews = interviewsJson as unknown as Interview[];
export const sectors = sectorsJson as unknown as Sector[];
export const itServices = itServicesJson as unknown as ItServices;

export const INDUSTRY_LABELS: Record<string, string> = { "30": "資訊服務業", "36": "數位雲端" };
export const meta = metaJson;

export const TRACK_IDS: TrackId[] = ["soft", "system", "ic"];
export const trackLabel = (id: string) => (meta.trackLabels as Record<string, string>)[id] ?? id;
export const roleLabel = (id: string) => (meta.roleLabels as Record<string, string>)[id] ?? id;
export const levelLabel = (id: string) => meta.levels.find((l) => l.id === id)?.label ?? id;

export const companyBySlug = (slug: string) => companies.find((c) => c.slug === slug);

export const SITE_URL = meta.site;

// PTT-style nicknames (螃蟹, 滷肉 …): short non-ASCII aliases of verified companies.
export const nicknamesOf = (c: Company) => (c.verified ? c.aliases.filter((a) => /^[^\x00-\x7f]{1,3}$/.test(a) && !c.name.includes(a)) : []);

export function describeCompany(c: Company) {
  const s = c.stats;
  const nick = nicknamesOf(c);
  const parts = [`${c.name}${nick.length ? `（${nick.join("、")}）` : ""}薪資：`];
  if (s?.monthly) parts.push(`月底薪中位數 ${s.monthly.median} 萬、總年薪中位數 ${s.annual?.median ?? "—"} 萬`);
  else parts.push(`${c.n} 筆匿名分享`);
  if (c.official) parts.push(`；官方 ${c.official.year} 年非主管薪資中位數 ${c.official.median} 萬`);
  parts.push(`。${c.n} 筆資料，含年終、工時與心得。`);
  return parts.join("");
}

export const fmtWan = (v: number | null | undefined, digits = 1) => (v == null ? "—" : `${v.toFixed(digits)} 萬`);
export const fmtNum = (v: number | null | undefined, digits = 1) => (v == null ? "—" : v.toFixed(digits));
