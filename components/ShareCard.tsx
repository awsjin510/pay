"use client";

import { useEffect, useRef, useState } from "react";

export type ShareResult = { trackLabel: string; trackPct: number; companyName?: string; companyPct?: number };

const W = 1080;
const H = 1080;
const C = { paper: "#f3f5f7", surface: "#ffffff", ink: "#14213d", ink2: "#44546c", ink3: "#5f6e84", brand: "#1f4e8c", line: "#c9d1dc" };

// A payslip-style image of where the person stands — percentile only, never the amount, so
// it is safe to post. Company name is opt-in.
async function draw(canvas: HTMLCanvasElement, r: ShareResult, showCompany: boolean) {
  const ctx = canvas.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const sans = getComputedStyle(document.body).fontFamily;
  const num = `${css.getPropertyValue("--font-barlow").trim() || "sans-serif"}, ${sans}`;
  const lines = [
    "科技業薪資參考", "我的薪資位置", `高於 ${r.trackPct}%`, `的「${r.trackLabel}」分享`,
    showCompany && r.companyName ? `在${r.companyName}高於 ${r.companyPct}%` : "", "pay.operation.tw", "免費查薪水，匿名分享你的",
  ].join("");
  await Promise.all([document.fonts.load(`700 40px ${sans}`, lines), document.fonts.load(`600 40px ${num}`, "0123456789%")]);

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  // Slightly tilted payslip with a soft shadow.
  ctx.save();
  ctx.translate(W / 2, H / 2 + 10);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.shadowColor = "rgba(20,33,61,0.16)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = C.surface;
  const pw = 820;
  const ph = 760;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.shadowColor = "transparent";
  // Torn bottom edge.
  ctx.fillStyle = C.paper;
  for (let x = -pw / 2; x < pw / 2; x += 20) {
    ctx.beginPath();
    ctx.arc(x + 10, ph / 2, 10, Math.PI, 0);
    ctx.fill();
  }
  const left = -pw / 2 + 64;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.brand;
  ctx.fillRect(left, -ph / 2 + 64, 30, 36);
  ctx.font = `700 34px ${sans}`;
  ctx.fillText("科技業薪資參考", left + 46, -ph / 2 + 94);
  ctx.fillStyle = C.ink;
  ctx.font = `700 40px ${sans}`;
  ctx.fillText("我的薪資位置", left, -ph / 2 + 190);
  ctx.fillRect(left, -ph / 2 + 212, pw - 128, 5);

  ctx.font = `600 190px ${num}`;
  ctx.fillText(`${r.trackPct}%`, left + 96, -ph / 2 + 430);
  ctx.font = `700 46px ${sans}`;
  ctx.fillText("高於", left, -ph / 2 + 330);
  ctx.fillStyle = C.ink2;
  ctx.fillText(`的「${r.trackLabel}」分享`, left, -ph / 2 + 510);

  if (showCompany && r.companyName && r.companyPct != null) {
    ctx.strokeStyle = C.line;
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, -ph / 2 + 560);
    ctx.lineTo(pw / 2 - 64, -ph / 2 + 560);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.ink;
    ctx.font = `700 40px ${sans}`;
    ctx.fillText(`在${r.companyName}高於 ${r.companyPct}%`, left, -ph / 2 + 625);
  }
  ctx.fillStyle = C.ink3;
  ctx.font = `700 30px ${sans}`;
  ctx.fillText("pay.operation.tw・免費查薪水，匿名分享你的", left, ph / 2 - 60);
  ctx.restore();
}

export function ShareCard({ result }: { result: ShareResult }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [showCompany, setShowCompany] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (canvas.current) draw(canvas.current, result, showCompany);
  }, [result, showCompany]);

  const blob = () => new Promise<Blob | null>((ok) => canvas.current!.toBlob(ok, "image/png"));
  const download = async () => {
    const b = await blob();
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "my-salary-position.png";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const share = async () => {
    const b = await blob();
    const file = b && new File([b], "my-salary-position.png", { type: "image/png" });
    const data = { title: "我的薪資位置", text: "免費查科技業薪水，也匿名分享你的：", url: "https://pay.operation.tw/?ref=share", files: file ? [file] : [] };
    try {
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share(data);
      else if (navigator.share) await navigator.share({ title: data.title, text: data.text, url: data.url });
      else {
        await navigator.clipboard.writeText(`${data.text}${data.url}`);
        setNote("已複製網站連結");
      }
    } catch {
      // The person closed the share sheet.
    }
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvas} width={W} height={H} className="w-full max-w-sm rounded-xl border border-border" aria-label="我的薪資位置分享圖" />
      {result.companyName && result.companyPct != null && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showCompany} onChange={(e) => setShowCompany(e.target.checked)} />
          圖上顯示公司名稱（預設不顯示，比較不會被認出來）
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={share} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
          分享
        </button>
        <button onClick={download} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm">
          下載圖片
        </button>
        {note && <span className="self-center text-sm text-ink-2">{note}</span>}
      </div>
      <p className="text-xs text-ink-3">圖上只有百分位，不會出現你的薪資金額。</p>
    </div>
  );
}
