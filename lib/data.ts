import companiesJson from "@/data/companies.json";
import interviewsJson from "@/data/interviews.json";
import metaJson from "@/data/meta.json";
import rolesJson from "@/data/roles.json";
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
  byLevel: LevelStats[];
};

export type Company = {
  slug: string;
  name: string;
  en: string | null;
  track: TrackId;
  verified: boolean;
  aliases: string[];
  n: number;
  latest: string | null;
  stats: Stats | null;
  recentStats: Stats | null;
};

export type Submission = {
  id: string;
  track: TrackId;
  company?: string;
  companyRaw: string;
  roleRaw: string;
  role: string;
  levelRaw: string;
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
  roles: { role: string; stats: Stats }[];
};

export type Role = {
  id: string;
  label: string;
  stats: Stats | null;
  byTrack: { track: TrackId; stats: Stats | null }[];
  topCompanies: { slug: string; name: string; n: number; monthly: Dist | null; annual: Dist | null }[];
};

export type Interview = { id: string; company: string; role: string; process: string; offered: boolean; salary: string | null };

export const companies = companiesJson as Company[];
export const submissions = submissionsJson as Submission[];
export const tracks = tracksJson as Track[];
export const roles = rolesJson as Role[];
export const interviews = interviewsJson as Interview[];
export const meta = metaJson;

export const TRACK_IDS: TrackId[] = ["soft", "system", "ic"];
export const trackLabel = (id: string) => (meta.trackLabels as Record<string, string>)[id] ?? id;
export const roleLabel = (id: string) => (meta.roleLabels as Record<string, string>)[id] ?? id;
export const levelLabel = (id: string) => meta.levels.find((l) => l.id === id)?.label ?? id;

export const companyBySlug = (slug: string) => companies.find((c) => c.slug === slug);

export const fmtWan = (v: number | null | undefined, digits = 1) => (v == null ? "—" : `${v.toFixed(digits)} 萬`);
export const fmtNum = (v: number | null | undefined, digits = 1) => (v == null ? "—" : v.toFixed(digits));
