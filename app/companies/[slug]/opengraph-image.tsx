import { ImageResponse } from "next/og";
import { companies, companyBySlug, meta, nicknamesOf } from "@/lib/data";
import { OG_SIZE, ogFonts, PayslipCard, type OgRow } from "@/lib/og";

export const alt = "公司薪資條";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = companyBySlug((await params).slug)!;
  const s = c.stats;
  const rows: OgRow[] = [];
  if (s?.monthly) rows.push({ label: "月底薪中位數", value: String(s.monthly.median), unit: "萬" });
  if (s?.annual) rows.push({ label: "總年薪中位數", value: String(s.annual.median), unit: "萬" });
  if (c.official) rows.push({ label: "非主管薪資", value: String(c.official.median), unit: "萬", official: true });
  if (!rows.length) rows.push({ label: "匿名分享", value: String(c.n), unit: "筆" });
  const nick = nicknamesOf(c);

  return new ImageResponse(
    <PayslipCard title={c.name} subtitle={`${nick.length ? `PTT 代號：${nick.join("、")}・` : ""}${c.n} 筆分享`} rows={rows} footer={c.official ? `官方：${c.official.year} 年公開資訊觀測站｜本站更新於 ${meta.generatedAt.slice(0, 10)}` : `本站更新於 ${meta.generatedAt.slice(0, 10)}`} />,
    { ...size, fonts: await ogFonts() },
  );
}
