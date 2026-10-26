"use client";

import { useSyncExternalStore } from "react";

// One localStorage value as React state: null on the server, during the first paint and
// whenever storage is blocked. Writes go through writeStored so every reader updates.
const EVENT = "local-store";

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export function useStored(key: string): string | null {
  return useSyncExternalStore(subscribe, () => read(key), () => null);
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the value lives only in component state.
  }
  window.dispatchEvent(new Event(EVENT));
}
