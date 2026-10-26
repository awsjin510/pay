"use client";

import { useState } from "react";
import { track } from "@/lib/track";

type Input = { monthly: number; p25: number; median: number; p75: number; verdict: "low" | "fair" | "high"; confidence: "high" | "medium" | "low"; basis: string };

const r1 = (v: number) => Math.round(v * 10) / 10;

// Where to anchor a counter-offer, from where the offer sits among comparable pay.
export function askRange({ monthly, p25, median, p75, verdict }: Input) {
  if (verdict === "low") return { low: r1(Math.max(median, monthly)), high: r1(Math.max(p75, monthly * 1.1)), why: `offer 低於同組中間一半（${p25}–${p75} 萬），以中位數到偏高的一端開價有根據。` };
  if (verdict === "fair") return { low: r1(Math.max(monthly * 1.05, median)), high: r1(Math.max(p75, monthly * 1.1)), why: "offer 在合理範圍內，談薪常見空間約 5–10%，高的一端以同組前 25% 的門檻為參考。" };
  return { low: r1(monthly), high: r1(monthly * 1.05), why: "offer 已高於同組多數人，月薪再加的空間有限，建議改談簽約金、年終保障或特休。" };
}

const CHECKLIST = [
  { title: "年終是「保障」還是「看績效」", body: "保障幾個月寫進 offer letter；績效獎金問近三年實際發放的平均。" },
  { title: "員工酬勞／分紅怎麼算", body: "發現金還是股票、何時發、到職第一年有沒有、離職時是否喪失。" },
  { title: "股票的歸屬時程", body: "幾年歸屬完、有沒有 cliff、以什麼股價計算。" },
  { title: "簽約金的綁約條件", body: "要待多久、提早離職是否要全數或依比例返還。" },
  { title: "試用期薪資與調薪週期", body: "試用期是否同薪；每年何時調薪、平均幅度多少。" },
  { title: "加班費與「責任制」", body: "平日延長工時前 2 小時至少加給 1/3、再 2 小時加給 2/3；責任制只適用勞動部核定職務且須書面約定。" },
  { title: "特休天數", body: "勞基法最低：滿半年 3 天、滿 1 年 7 天、滿 2 年 10 天、滿 3 年 14 天、滿 5 年 15 天。很多公司到職即給，可以談。" },
  { title: "遠端與彈性工時", body: "每週幾天、是否寫進合約、試用期是否適用。" },
  { title: "職級與下一次升遷", body: "職級決定薪資帶上限；問清楚對應哪一級、多久能升。" },
  { title: "全部拿到書面", body: "口頭承諾不算數，所有條件都要出現在 offer letter。" },
];

export function Negotiation(props: Input) {
  const range = askRange(props);
  const [copied, setCopied] = useState(false);
  const script = `參考公開的薪資資料，${props.basis}的月底薪中位數約 ${props.median} 萬，中間一半落在 ${props.p25}–${props.p75} 萬。考量我的經驗與這個職務的範圍，希望月底薪能到 ${range.high} 萬，想請問有沒有調整的空間？`;

  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="negotiate-heading">
      <h2 id="negotiate-heading" className="text-lg font-bold">
        談薪建議
      </h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-ink-2">建議開價月底薪</span>
        <span className="num text-2xl font-semibold">
          {range.low === range.high ? range.high : `${range.low}–${range.high}`}
        </span>
        <span className="text-sm text-ink-2">萬</span>
      </div>
      <p className="mt-1 text-sm text-ink-2">{range.why}</p>
      {props.confidence !== "high" && <p className="mt-1 text-xs text-ink-3">比對資料不多，開價前最好再參考其他來源或同業朋友的數字。</p>}

      <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm leading-6">
        <div className="mb-1 text-xs text-ink-3">可以這樣說</div>
        {script}
        <button
          type="button"
          onClick={async () => {
            track("negotiate_copy");
            try {
              await navigator.clipboard.writeText(script);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              // Clipboard blocked: the text is on screen to select by hand.
            }
          }}
          className="mt-2 block min-h-11 text-sm font-medium text-accent underline sm:min-h-0"
        >
          {copied ? "已複製" : "複製這段話"}
        </button>
      </div>

      <details className="group mt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium sm:min-h-0">
          <span aria-hidden="true" className="text-ink-3 transition-transform group-open:rotate-90">
            ▸
          </span>
          簽約前要問清楚的 {CHECKLIST.length} 件事</summary>
        <ul className="mt-2 space-y-2">
          {CHECKLIST.map((c) => (
            <li key={c.title}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
                <span>
                  <span className="font-medium">{c.title}</span>
                  <span className="block text-ink-2">{c.body}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-3">勞基法規定以勞動部公告為準；這份清單是參考，不是法律意見。</p>
      </details>
    </section>
  );
}
