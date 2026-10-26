// Labels shared by server pages and client forms; kept apart from lib/data.ts so client
// components don't pull the whole dataset into their bundle.
export type OvertimePay = "legal" | "comp" | "partial" | "none" | "rare";
export const OVERTIME_PAY_LABELS: Record<OvertimePay, string> = {
  legal: "依法給加班費",
  comp: "給補休",
  partial: "有給但打折／定額",
  none: "沒有加班費",
  rare: "幾乎不加班",
};
