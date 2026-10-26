"use client";

import { useEffect, useRef, useState } from "react";
import { ShareCard, type ShareResult } from "@/components/ShareCard";
import { track } from "@/lib/track";

type Status = { state: "idle" | "sending" | "done" | "error"; message?: string };

async function post(url: string, body: Record<string, unknown>): Promise<Status> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return { state: "done" };
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { state: "error", message: data.error ?? `送出失敗（${res.status}）` };
  } catch {
    return { state: "error", message: "網路錯誤，請稍後再試" };
  }
}

// Turns FormData into the API's JSON, dropping empty fields.
function formJson(form: HTMLFormElement) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of new FormData(form).entries()) if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
  return out;
}

const input = "w-full rounded-lg border border-border bg-background px-3 py-2";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

// Off-screen trap field; bots fill it, people never see it.
const Honeypot = () => (
  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
);

function Result({ status, done }: { status: Status; done: string }) {
  if (status.state === "done") return <p className="rounded-lg border border-accent p-3 text-sm">{done}</p>;
  if (status.state === "error") return <p className="text-sm text-ink" role="alert">⚠ {status.message}</p>;
  return null;
}

type IndexEntry = { s: string; n: string; e: string | null; a: string[]; t: string; c: number };
type PrIndex = { tracks: Record<string, number[]>; companies: Record<string, number[]> };

const TRACK_LABELS: Record<string, string> = { soft: "純軟", system: "系統廠", ic: "IC 設計" };
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
const percentile = (values: number[], v: number) =>
  Math.round(((values.filter((x) => x < v).length + values.filter((x) => x === v).length / 2) / values.length) * 100);

let indexCache: Promise<IndexEntry[]> | null = null;
const loadIndex = () => (indexCache ??= fetch("/search-index.json").then((r) => r.json() as Promise<IndexEntry[]>));

const findCompany = (index: IndexEntry[], name: string) => {
  const k = norm(name);
  return index.find((e) => [e.n, e.e ?? "", ...e.a].some((x) => norm(x) === k));
};

async function shareResult(body: Record<string, unknown>): Promise<ShareResult | null> {
  try {
    const [pr, index] = await Promise.all([fetch("/pr-index.json").then((r) => r.json() as Promise<PrIndex>), loadIndex()]);
    const monthly = Number(body.monthly);
    const track = String(body.track);
    const company = findCompany(index, String(body.company));
    const companyValues = company ? pr.companies[company.s] : undefined;
    return {
      trackLabel: TRACK_LABELS[track],
      trackPct: percentile(pr.tracks[track], monthly),
      ...(company && companyValues ? { companyName: company.n, companyPct: percentile(companyValues, monthly) } : {}),
    };
  } catch {
    return null;
  }
}

type Done = { status: "approved" | "pending"; share: ShareResult | null };

// Handed over by the offer checker through sessionStorage, so salaries never sit in a URL.
export type OfferPrefill = { company: string; track: string; role: string; yoe: string; monthly: string; bonus: string };
export const OFFER_PREFILL_KEY = "offerPrefill";

export function SubmitForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [done, setDone] = useState<Done | null>(null);
  const [suggestions, setSuggestions] = useState<IndexEntry[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);

  // Prefill from /submit/?company=mediatek (the company page button) and keep ?ref= for
  // attribution. The page is static, so these are only known in the browser.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const q = new URLSearchParams(window.location.search);
    const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
    track("submit_view");
    const setKind = (kind: string) => {
      const radio = form.querySelector<HTMLInputElement>(`input[name="kind"][value="${kind}"]`);
      if (radio) radio.checked = true;
    };
    if (q.get("kind") === "offer") setKind("offer");
    let prefill: OfferPrefill | null = null;
    try {
      prefill = JSON.parse(sessionStorage.getItem(OFFER_PREFILL_KEY) ?? "null");
      sessionStorage.removeItem(OFFER_PREFILL_KEY);
    } catch {
      prefill = null;
    }
    if (prefill) {
      setKind("offer");
      set("company", prefill.company);
      set("track", prefill.track);
      set("role", prefill.role);
      set("yoe", prefill.yoe);
      set("monthly", prefill.monthly);
      set("bonus_months", prefill.bonus);
    }
    let ref = q.get("ref");
    try {
      ref ??= sessionStorage.getItem("ref");
    } catch {
      // Storage blocked: only a ref in this URL counts.
    }
    if (ref) set("ref", ref);
    const slug = q.get("company");
    loadIndex().then((index) => {
      setSuggestions([...index].sort((a, b) => b.c - a.c).slice(0, 400));
      const hit = slug && !prefill ? index.find((e) => e.s === slug) : undefined;
      if (hit) {
        set("company", hit.n);
        set("track", hit.t);
      }
    });
  }, []);

  if (done)
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent bg-accent-soft p-4">
          <p className="font-medium">感謝分享！</p>
          <p className="mt-1 text-sm text-ink-2">
            {done.status === "approved"
              ? "數字看起來合理，已自動通過，會在下一次每週更新時出現在網站上。"
              : "因為有填寫心得或需要確認的數字，會在人工審核後（通常 7 天內）公開。"}
          </p>
        </div>
        {done.share && (
          <div>
            <h2 className="text-xl font-bold">你的位置</h2>
            <p className="mt-1 mb-3 text-ink-2">
              你的月底薪高於 <strong className="num text-2xl text-ink">{done.share.trackPct}%</strong> 的「{done.share.trackLabel}」分享
              {done.share.companyName && done.share.companyPct != null && (
                <>
                  ，在{done.share.companyName}高於 <strong className="num text-2xl text-ink">{done.share.companyPct}%</strong>
                </>
              )}
              。
            </p>
            <ShareCard result={done.share} />
          </div>
        )}
      </div>
    );

  return (
    <form
      ref={formRef}
      className="relative space-y-5"
      onFocus={() => {
        if (started.current) return;
        started.current = true;
        track("submit_start");
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const body = formJson(form);
        body.agree = (form.elements.namedItem("agree") as HTMLInputElement).checked;
        setStatus({ state: "sending" });
        try {
          const res = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          const data = (await res.json().catch(() => ({}))) as { error?: string; status?: "approved" | "pending" };
          if (!res.ok) {
            track("submit_error", String(res.status));
            setStatus({ state: "error", message: data.error ?? `送出失敗（${res.status}）` });
            return;
          }
          track("submit_success", `${data.status ?? "pending"}:${body.kind ?? "current"}`);
          setDone({ status: data.status ?? "pending", share: await shareResult(body) });
        } catch {
          setStatus({ state: "error", message: "網路錯誤，請稍後再試" });
        }
      }}
    >
      <Honeypot />
      <input type="hidden" name="ref" />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm">要分享的是</legend>
        {[
          { v: "current", label: "目前的薪資" },
          { v: "offer", label: "收到的 offer" },
        ].map((k) => (
          <label key={k.v} className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm has-checked:border-accent has-checked:bg-accent-soft">
            <input type="radio" name="kind" value={k.v} defaultChecked={k.v === "current"} className="accent-[var(--brand)]" />
            {k.label}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="產業">
          <select name="track" required className={input} defaultValue="">
            <option value="" disabled>
              請選擇
            </option>
            <option value="soft">純軟（含資訊服務、雲端、資安）</option>
            <option value="system">系統廠／硬體</option>
            <option value="ic">IC 設計</option>
          </select>
        </Field>
        <Field label="公司" hint="可用代號，例如「螃蟹」">
          <input name="company" required maxLength={80} list="company-suggestions" autoComplete="off" className={input} />
          <datalist id="company-suggestions">
            {suggestions.map((e) => (
              <option key={e.s} value={e.n} />
            ))}
          </datalist>
        </Field>
        <Field label="職務" hint="例如 SRE、韌體工程師、PM">
          <input name="role" required maxLength={60} className={input} />
        </Field>
        <Field label="相關年資（年）">
          <input name="yoe" type="number" required min={0} max={50} step={0.5} className={input} />
        </Field>
        <Field label="月底薪（萬）" hint="例如 7.5，不是 75000">
          <input name="monthly" type="number" required min={2} max={80} step={0.1} className={input} />
        </Field>
        <Field label="年終＋獎金（幾個月，選填）" hint="不含分紅">
          <input name="bonus_months" type="number" min={0} max={60} step={0.1} className={input} />
        </Field>
      </div>

      <details className="rounded-xl border border-border bg-surface px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">填更多細節（選填，讓資料更有參考價值）</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="職級" hint="例如 E7、L4">
            <input name="level" maxLength={30} className={input} />
          </Field>
          <Field label="現職年資（年）">
            <input name="yoe_current" type="number" min={0} max={50} step={0.5} className={input} />
          </Field>
          <Field label="總年薪（萬，含分紅）">
            <input name="annual" type="number" min={15} max={3000} step={1} className={input} />
          </Field>
          <Field label="每日平均工時（小時）">
            <input name="hours_per_day" type="number" min={1} max={16} step={0.5} className={input} />
          </Field>
          <Field label="每月加班（小時）">
            <input name="overtime_per_month" type="number" min={0} max={250} step={1} className={input} />
          </Field>
          <Field label="加班頻率（1 很少 – 5 很常）">
            <input name="overtime_freq" type="number" min={1} max={5} step={1} className={input} />
          </Field>
          <Field label="爽度（1–5，5 最爽）">
            <input name="happiness" type="number" min={1} max={5} step={1} className={input} />
          </Field>
          <Field label="Loading（1–5，5 最重）">
            <input name="loading" type="number" min={1} max={5} step={1} className={input} />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="證照（雲端／資安）" hint="例如 AWS SAA、CKA、OSCP、CISSP">
            <input name="certifications" maxLength={120} className={input} />
          </Field>
          <Field label="面試題型" hint="例如 系統設計、K8s 架構、Leetcode medium、CTF">
            <input name="interview_topics" maxLength={400} className={input} />
          </Field>
          <Field label="心得" hint="主觀感受與建議都可以；請勿寫姓名、未經證實的指控或能認出人的細節。有填文字的投稿會人工審核">
            <textarea name="comment" maxLength={1000} rows={4} className={input} />
          </Field>
        </div>
      </details>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agree" required className="mt-1" />
        <span>我確認內容為本人真實經驗，並同意投稿規範與以 CC BY 4.0 彙總公開。</span>
      </label>
      <button disabled={status.state === "sending"} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60">
        {status.state === "sending" ? "送出中…" : "送出，看我的位置"}
      </button>
      <Result status={status} done="" />
    </form>
  );
}

const KINDS = [
  { id: "takedown", label: "下架申請（內容不實、侵權、可識別個人）" },
  { id: "error", label: "資料錯誤回報" },
  { id: "contact", label: "合作 / 贊助 / 其他聯絡" },
];

export function ReportForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // Prefill from links like /report/?kind=error&target=soft-12. The page is static, so the
  // query string is only known in the browser; the fields are uncontrolled.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const q = new URLSearchParams(window.location.search);
    const kind = q.get("kind");
    if (kind && KINDS.some((k) => k.id === kind)) (form.elements.namedItem("kind") as HTMLSelectElement).value = kind;
    if (q.get("target")) (form.elements.namedItem("target") as HTMLInputElement).value = q.get("target")!;
  }, []);

  if (status.state === "done") return <Result status={status} done="已收到，我們會在 7 個工作天內處理；有留聯絡方式的會回覆結果。" />;

  return (
    <form
      ref={formRef}
      className="relative space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus({ state: "sending" });
        setStatus(await post("/api/reports", formJson(e.currentTarget)));
      }}
    >
      <Honeypot />
      <Field label="類型 *">
        <select name="kind" defaultValue="takedown" className={input}>
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="對象" hint="網址或資料編號（每筆分享的「回報這筆資料」會自動帶入）">
        <input name="target" maxLength={300} className={input} />
      </Field>
      <Field label="說明 *" hint="至少 10 字">
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={input} />
      </Field>
      <Field label="聯絡方式（選填）" hint="email 或其他，只用於回覆這次申請，不會公開">
        <input name="contact" maxLength={120} className={input} />
      </Field>
      <button disabled={status.state === "sending"} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60">
        {status.state === "sending" ? "送出中…" : "送出"}
      </button>
      <Result status={status} done="" />
    </form>
  );
}
