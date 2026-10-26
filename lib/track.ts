"use client";

// Count-only product analytics: the event name, a coarse scope and the visit's ?ref= source.
// No ids, no cookies, no salary values — the server just increments a daily counter.
export type TrackEvent =
  | "answer_view"
  | "thin_view"
  | "search_select"
  | "search_empty"
  | "submit_view"
  | "submit_start"
  | "submit_success"
  | "submit_error"
  | "share_click"
  | "share_download"
  | "offer_view"
  | "offer_check"
  | "offer_share_click"
  | "compare_used";

export function track(name: TrackEvent, scope = "") {
  if (typeof window === "undefined" || location.hostname === "localhost") return;
  let ref = "";
  try {
    ref = sessionStorage.getItem("ref") ?? "";
  } catch {
    // Storage blocked: count without a source.
  }
  const body = JSON.stringify({ name, scope, ref });
  try {
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {
    // Analytics must never break the page.
  }
}
