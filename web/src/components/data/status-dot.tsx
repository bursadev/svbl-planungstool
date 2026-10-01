import { cn } from "@/lib/utils";

/** Handoff status colours; `muted` for states without a semantic colour. */
export type StatusTone = "ok" | "warn" | "bad" | "accent" | "alt" | "muted";

const TONE_CLASS: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
  alt: "bg-alt",
  muted: "bg-muted-foreground/40",
};

type StatusDotProps = {
  tone: StatusTone;
  /** Text next to the dot, e.g. «verfügbar»; without it only the dot renders. */
  label?: string;
  className?: string;
};

/** The handoff's status dot (`size-2 rounded-full bg-ok|warn|bad`), optionally with a label. */
export function StatusDot({ tone, label, className }: StatusDotProps) {
  const dot = (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", TONE_CLASS[tone], !label && className)}
    />
  );
  if (!label) return dot;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {dot}
      {label}
    </span>
  );
}
