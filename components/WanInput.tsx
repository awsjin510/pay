"use client";

import { useState } from "react";

// Monthly pay is asked in 萬, but people type 75000 (元) or 75 (千). Convert on blur and say so,
// instead of failing validation. Forms also run toWan() on submit, for Enter without a blur.
export function toWan(raw: string): { value: string; note: string | null } {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n)) return { value: raw, note: null };
  if (n >= 1000) {
    const v = Math.round(n / 1000) / 10;
    return { value: String(v), note: `已換算：${n.toLocaleString()} 元 → ${v} 萬` };
  }
  if (n > 80) {
    const v = Math.round(n) / 10;
    return { value: String(v), note: `已換算：${n} 千 → ${v} 萬` };
  }
  return { value: raw, note: null };
}

export function WanInput({ name, className, required = true }: { name: string; className: string; required?: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        required={required}
        min={0}
        step="any"
        placeholder="例如 7.5"
        className={className}
        onBlur={(e) => {
          const { value, note } = toWan(e.currentTarget.value);
          e.currentTarget.value = value;
          setNote(note);
        }}
      />
      {note && (
        <span className="mt-1 block text-xs text-data-text" role="status">
          {note}
        </span>
      )}
    </>
  );
}
