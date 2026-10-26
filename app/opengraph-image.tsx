import { ImageResponse } from "next/og";
import { meta, tracks } from "@/lib/data";
import { OG_SIZE, ogFonts, PayslipCard } from "@/lib/og";

export const alt = "科技業薪資參考";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  return new ImageResponse(
    <PayslipCard
      title={["工程師的薪資條，", "攤開來看。"]}
      subtitle={`${meta.total.toLocaleString()} 筆匿名分享，對照官方揭露`}
      footer={`資料更新於 ${meta.generatedAt.slice(0, 10)}`}
      rows={tracks.map((t) => ({ label: `${t.label}月底薪`, value: String(t.stats?.monthly?.median ?? "—"), unit: "萬" }))}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
