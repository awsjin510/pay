"use client";

import { useEffect } from "react";
import { track, type TrackEvent } from "@/lib/track";

// Fires one event when a (static) page is viewed.
export function TrackView({ name, scope = "" }: { name: TrackEvent; scope?: string }) {
  useEffect(() => track(name, scope), [name, scope]);
  return null;
}
