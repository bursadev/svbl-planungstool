import { cn } from "@/lib/utils";

const count = new Intl.NumberFormat("de-CH");

export type StageKpi = { label: string; value: number | string; tone?: "default" | "warn" | "bad" | "ok"; hint?: string };

/** The number tiles of a stage («Lernende 503 · Module 5 · Kurse nötig 57 · Kurstage 146»). */
export function StageKpis({ kpis }: { kpis: StageKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{kpi.label}</div>
          <div
            className={cn(
              "font-mono text-xl font-semibold tabular-nums",
              kpi.tone === "warn" && "text-warn",
              kpi.tone === "bad" && "text-bad",
              kpi.tone === "ok" && "text-ok",
            )}
          >
            {typeof kpi.value === "number" ? count.format(kpi.value) : kpi.value}
          </div>
          {kpi.hint ? <div className="text-xs text-muted-foreground">{kpi.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
