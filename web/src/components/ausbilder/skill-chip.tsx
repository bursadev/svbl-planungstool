import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SkillChipProps = {
  name: string;
  /** Renders a × button after the name. */
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
};

/** Rounded skill chip; with `onRemove` it gets the × of the «Skills & Wissen» tab. */
export function SkillChip({ name, onRemove, disabled = false, className }: SkillChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium whitespace-nowrap",
        onRemove && "pr-1",
        className,
      )}
    >
      <span className="truncate">{name}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`${name} entfernen`}
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <XIcon aria-hidden className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

/** Up to `max` chips, the rest folded into «+n». */
export function SkillChips({ skills, max = 4 }: { skills: { id: string; name: string }[]; max?: number }) {
  if (skills.length === 0) return <span className="text-muted-foreground">–</span>;
  const shown = skills.slice(0, max);
  const rest = skills.length - shown.length;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {shown.map((skill) => (
        <SkillChip key={skill.id} name={skill.name} />
      ))}
      {rest > 0 ? (
        <span
          className="inline-flex h-6 items-center rounded-full px-1.5 font-mono text-xs text-muted-foreground tabular-nums"
          title={skills.slice(max).map((skill) => skill.name).join(", ")}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
