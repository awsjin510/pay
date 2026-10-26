import type { Metadata } from "next";
import { CompareTool, type CompareEntry } from "@/components/CompareTool";
import { companies, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "公司薪資比較",
  description: "最多三間科技公司並排比較月底薪、總年薪、官方非主管薪資、年終、工時與爽度。",
  alternates: { canonical: "/compare/" },
};

export default function ComparePage() {
  const entries: CompareEntry[] = companies
    .filter((c) => c.stats)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      aliases: c.aliases,
      track: c.track,
      n: c.n,
      recentN: c.stats!.recentN,
      monthly: c.stats!.monthly,
      annual: c.stats!.annual,
      bonus: c.stats!.bonusMonths?.median ?? null,
      hours: c.stats!.hoursPerDay?.median ?? null,
      overtime: c.stats!.overtimePerMonth?.median ?? null,
      happiness: c.stats!.happiness,
      loading: c.stats!.loading,
      official: c.official?.median ?? null,
      officialYear: c.official?.year ?? null,
    }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">公司薪資比較</h1>
        <p className="mt-1 text-sm text-ink-2">選 2–3 間公司並排比較。網址會記住你的選擇，可以直接分享。</p>
      </header>
      <CompareTool entries={entries} trackLabels={meta.trackLabels} />
    </div>
  );
}
