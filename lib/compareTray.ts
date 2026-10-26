"use client";

import { useSyncExternalStore } from "react";

// Companies picked for comparison, kept in localStorage so the choice survives page changes.
export type TrayItem = { slug: string; name: string };
export const TRAY_MAX = 3;
const KEY = "compareTray";
const EVENT = "compare-tray";

let snapshot: TrayItem[] = [];
let raw = "";

function read(): TrayItem[] {
  let next = "[]";
  try {
    next = localStorage.getItem(KEY) ?? "[]";
  } catch {
    // Storage blocked: the tray stays empty.
  }
  if (next !== raw) {
    raw = next;
    try {
      snapshot = JSON.parse(next);
    } catch {
      snapshot = [];
    }
  }
  return snapshot;
}

export function setTray(items: TrayItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, TRAY_MAX)));
  } catch {
    // Storage blocked: nothing to persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

const EMPTY: TrayItem[] = [];
export const useTray = () => useSyncExternalStore(subscribe, read, () => EMPTY);
