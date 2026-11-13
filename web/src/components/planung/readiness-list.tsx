import { StatusDot } from "@/components/data";
import type { ReadinessReport } from "@/lib/api/planning-runs";
import { READINESS_LABELS } from "./labels";

/**
 * «Bereitschaft»: one row per rule with dot (ok, warning, skipped), message and details; collapsed
 * by default so the stages stay in view, open when something is missing.
 */
export function ReadinessList({ report }: { report: ReadinessReport | null }) {
  if (!report) return null;
  const gaps = report.items.filter((item) => item.status !== "ok").length;
  return (
    <details className="rounded-xl border border-border bg-card" open={gaps > 0}>
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold">
        Bereitschaft der Daten
        <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
          {gaps === 0 ? "alle Regeln aktiv" : `${gaps} Regeln mit Lücken`}
        </span>
      </summary>
      <ul className="flex flex-col gap-2 border-t border-border px-4 py-3 text-[13px]">
        {report.items.map((item) => (
          <li key={item.rule} className="flex items-start gap-2">
            <StatusDot tone={item.status === "ok" ? "ok" : item.status === "warning" ? "warn" : "muted"} className="mt-1.5" />
            <span className="w-32 shrink-0 text-muted-foreground">{READINESS_LABELS[item.rule]}</span>
            <span className="min-w-0">
              {item.message}
              {item.details?.length ? (
                <details className="mt-0.5 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Details ({item.details.length})</summary>
                  <ul className="mt-1 max-h-40 list-disc overflow-y-auto ps-4">
                    {item.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
