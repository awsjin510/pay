import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared look for social share images: the payslip on cool paper. Rendered at build time.

export const OG_SIZE = { width: 1200, height: 630 };

let fontPromise: Promise<Buffer | null> | null = null;
export const ogFont = () =>
  (fontPromise ??= readFile(join(process.cwd(), "data/raw/NotoSansTC-Bold.otf")).catch(() => null));

export async function ogFonts() {
  const data = await ogFont();
  return data ? [{ name: "Noto Sans TC", data, weight: 700 as const, style: "normal" as const }] : [];
}

const C = { paper: "#f3f5f7", surface: "#ffffff", ink: "#14213d", ink2: "#44546c", ink3: "#5f6e84", brand: "#1f4e8c", seal: "#c2362f", line: "#c9d1dc" };

export type OgRow = { label: string; value: string; unit: string; official?: boolean };

export function PayslipCard({ title, subtitle, rows, footer }: { title: string | string[]; subtitle: string; rows: OgRow[]; footer?: string }) {
  const lines = Array.isArray(title) ? title : [title];
  const longest = Math.max(...lines.map((l) => l.length));
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: C.paper, padding: "56px 72px", fontFamily: "Noto Sans TC", color: C.ink }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 420, paddingRight: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, color: C.brand }}>
          <div style={{ width: 34, height: 40, background: C.brand, borderRadius: 3 }} />
          科技業薪資參考
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {lines.map((l) => (
            <div key={l} style={{ fontSize: longest > 6 ? 60 : 84, lineHeight: 1.15 }}>
              {l}
            </div>
          ))}
          <div style={{ fontSize: 28, color: C.ink2, marginTop: 16 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 22, color: C.ink3 }}>pay.operation.tw</div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: C.surface,
          padding: "36px 44px",
          borderRadius: 6,
          boxShadow: "0 18px 40px rgba(20,33,61,0.14)",
          transform: "rotate(-1.2deg)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, borderBottom: `4px solid ${C.ink}`, paddingBottom: 12 }}>薪資條</div>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "flex-end", marginTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: C.ink2 }}>
              {r.label}
              {r.official && (
                <div style={{ marginLeft: 12, fontSize: 20, color: C.seal, border: `3px solid ${C.seal}`, borderRadius: 8, padding: "0 8px", transform: "rotate(-6deg)" }}>官方</div>
              )}
            </div>
            <div style={{ flex: 1, borderBottom: `3px dashed ${C.line}`, margin: "0 16px 12px" }} />
            <div style={{ fontSize: 56, lineHeight: 1, color: r.official ? C.seal : C.ink }}>{r.value}</div>
            <div style={{ fontSize: 24, color: C.ink2, marginLeft: 8, marginBottom: 4 }}>{r.unit}</div>
          </div>
        ))}
        {footer && <div style={{ marginTop: "auto", fontSize: 20, color: C.ink3, borderTop: `2px dashed ${C.line}`, paddingTop: 14 }}>{footer}</div>}
      </div>
    </div>
  );
}
