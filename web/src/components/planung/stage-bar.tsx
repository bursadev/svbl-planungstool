import Link from "next/link";
import type { PlanningRun } from "@/lib/api/planning-runs";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS, reachedStage } from "./labels";

const count = new Intl.NumberFormat("de-CH");

function metaOf(run: PlanningRun, index: number): string {
  const c = run.counts;
  switch (index) {
    case 0:
      return c.demandGroups ? `${count.format(c.coursesNeeded)} Kurse nötig` : "noch nicht erzeugt";
    case 1:
      return c.coursesProposed + c.coursesUnplannable ? `${count.format(c.coursesProposed)} vorgeschlagen` : "offen";
    case 2:
      return c.coursesStaffed ? `${count.format(c.coursesStaffed)} zugeteilt` : "offen";
    default:
      return run.status === "committed" ? "übernommen" : "offen";
  }
}

/**
 * The four stages as a clickable bar (design §3): number, title, meta. Reached stages get a
 * green number, the active one the accent background; stages without data are not clickable.
 */
export function StageBar({ run, active, href }: { run: PlanningRun; active: number; href: (stage: number) => string }) {
  const reached = reachedStage(run);
  return (
    <nav aria-label="Stufen" className="grid gap-2 sm:grid-cols-4">
      {STAGES.map((stage, index) => {
        const enabled = index === 0 || reached >= 0;
        const done = index <= reached;
        const isActive = index === active;
        const body = (
          <>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                done ? "bg-ok text-white" : isActive ? "bg-accent text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-medium", isActive && "text-accent")}>{STAGE_LABELS[stage]}</span>
              <span className="block truncate text-xs text-muted-foreground">{metaOf(run, index)}</span>
            </span>
          </>
        );
        const className = cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left",
          isActive && "border-accent/40 bg-accent-soft",
          !enabled && "opacity-60",
        );
        return enabled ? (
          <Link key={stage} href={href(index + 1)} aria-current={isActive ? "step" : undefined} className={className} scroll={false}>
            {body}
          </Link>
        ) : (
          <div key={stage} aria-disabled className={className}>
            {body}
          </div>
        );
      })}
    </nav>
  );
}
