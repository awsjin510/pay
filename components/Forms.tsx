"use client";

import { useEffect, useRef, useState } from "react";

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

const input = "w-full rounded border border-border bg-background px-3 py-2";

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
  if (status.state === "done") return <p className="rounded border border-accent p-3 text-sm">{done}</p>;
  if (status.state === "error") return <p className="text-sm text-ink" role="alert">⚠ {status.message}</p>;
  return null;
}

export function SubmitForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  if (status.state === "done")
    return <Result status={status} done="感謝分享！投稿會在人工審核後（通常 7 天內）出現在網站上。" />;

  return (
    <form
      className="relative space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = formJson(e.currentTarget);
        body.agree = (e.currentTarget.elements.namedItem("agree") as HTMLInputElement).checked;
        setStatus({ state: "sending" });
        setStatus(await post("/api/submissions", body));
      }}
    >
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="產業 *">
          <select name="track" required className={input} defaultValue="">
            <option value="" disabled>
              請選擇
            </option>
            <option value="soft">純軟</option>
            <option value="system">系統廠 / 硬體</option>
            <option value="ic">IC 設計</option>
          </select>
        </Field>
        <Field label="公司 *" hint="可用代號，例如「螃蟹」，但請別寫部門或主管姓名">
          <input name="company" required maxLength={80} className={input} />
        </Field>
        <Field label="職務 *" hint="例如 SRE、資安研究員、韌體工程師">
          <input name="role" required maxLength={60} className={input} />
        </Field>
        <Field label="職級" hint="例如 E7、L4；不確定可留空">
          <input name="level" maxLength={30} className={input} />
        </Field>
        <Field label="相關年資（年）">
          <input name="yoe" type="number" min={0} max={50} step={0.5} className={input} />
        </Field>
        <Field label="現職年資（年）">
          <input name="yoe_current" type="number" min={0} max={50} step={0.5} className={input} />
        </Field>
        <Field label="月底薪（萬）*" hint="例如 7.5，不是 75000">
          <input name="monthly" type="number" required min={2} max={80} step={0.1} className={input} />
        </Field>
        <Field label="年終＋獎金（幾個月，不含分紅）">
          <input name="bonus_months" type="number" min={0} max={60} step={0.1} className={input} />
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
      <Field label="證照（雲端 / 資安選填）" hint="例如 AWS SAA、CKA、OSCP、CISSP">
        <input name="certifications" maxLength={120} className={input} />
      </Field>
      <Field label="面試題型（選填）" hint="例如 系統設計、K8s 架構、Leetcode medium、CTF">
        <input name="interview_topics" maxLength={400} className={input} />
      </Field>
      <Field label="心得（選填）" hint="可寫主觀感受與建議；請勿寫姓名、未經證實的指控或可辨識個人的細節">
        <textarea name="comment" maxLength={1000} rows={4} className={input} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agree" required className="mt-1" />
        <span>我確認內容為本人真實經驗，並同意下方的投稿規範與以 CC BY 4.0 彙總公開。</span>
      </label>
      <button disabled={status.state === "sending"} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60">
        {status.state === "sending" ? "送出中…" : "送出投稿"}
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
