"use client";

import { useSyncExternalStore } from "react";
import { format } from "date-fns";
import { formatDateWithWeekday, formatIsoWeek } from "@/lib/format";

const subscribe = () => () => {};
const todayKey = () => format(new Date(), "yyyy-MM-dd");
const serverKey = () => null;

/**
 * Today as `Do 1.10.2026 · KW 40`. The value is read on the client only, so a statically
 * prerendered page never shows the build date; the server renders an empty slot of the same height.
 */
export function HeaderDate() {
  const today = useSyncExternalStore(subscribe, todayKey, serverKey);
  return (
    <time dateTime={today ?? undefined} className="font-mono text-xs text-muted-foreground tabular-nums">
      {today ? `${formatDateWithWeekday(today)} · ${formatIsoWeek(today)}` : " "}
    </time>
  );
}
