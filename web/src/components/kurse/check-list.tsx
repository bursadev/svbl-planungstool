import { StatusDot } from "@/components/data";
import type { CheckResult } from "@/lib/api/courses";
import { cn } from "@/lib/utils";

/** The hard rules of a check, one row each with dot and reason; optionally the soft reasons below. */
export function CheckList({ result, soft = false, className }: { result: CheckResult; soft?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 text-[13px]", className)}>
      {result.hard.map((rule, index) => (
        <div key={`${rule.label}-${index}`} className="flex items-start gap-2">
          <StatusDot tone={rule.ok ? "ok" : "bad"} className="mt-1.5" />
          <span className="w-36 shrink-0 text-muted-foreground">{rule.label}</span>
          <span className={cn("min-w-0", !rule.ok && "text-bad")}>{rule.reason}</span>
        </div>
      ))}
      {soft && result.soft.length ? (
        <div className="mt-1 text-xs text-muted-foreground">{result.soft.map((s) => s.text).join(" · ")}</div>
      ) : null}
    </div>
  );
}

/** The positive soft reasons without their «(+n)» suffix, joined for a one-line «Begründung». */
export function softSummary(result: CheckResult, limit = 2): string {
  return result.soft
    .filter((s) => s.delta > 0)
    .slice(0, limit)
    .map((s) => s.text.replace(/\s\(.*\)$/, ""))
    .join(" · ");
}

/** The first violated hard rule, e.g. «Sprache: spricht kein Französisch (de)». */
export function firstViolation(result: CheckResult): string {
  const failed = result.hard.find((h) => !h.ok);
  return failed ? `${failed.label}: ${failed.reason}` : "";
}
