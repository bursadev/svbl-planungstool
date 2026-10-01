"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CheckboxOption = {
  id: string;
  label: string;
  /** Monospaced text at the right edge, e.g. a code. */
  hint?: string;
};

type CheckboxListProps = {
  options: CheckboxOption[];
  /** Selected ids; kept in the order of `options`. */
  value: string[];
  onChange: (value: string[]) => void;
  emptyText?: string;
  className?: string;
};

/** Scrollable multi-select for a handful of catalogue entries (Kurstypen, Zertifikatstypen, Skills). */
export function CheckboxList({
  options,
  value,
  onChange,
  emptyText = "Keine Einträge vorhanden.",
  className,
}: CheckboxListProps) {
  const selected = new Set(value);

  function toggle(id: string, checked: boolean) {
    onChange(options.filter((option) => (option.id === id ? checked : selected.has(option.id))).map((o) => o.id));
  }

  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div role="group" className={cn("max-h-48 overflow-y-auto rounded-lg border border-input py-1", className)}>
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-sm hover:bg-muted/60 has-[:focus-visible]:bg-muted/60"
        >
          <Checkbox
            checked={selected.has(option.id)}
            onCheckedChange={(checked) => toggle(option.id, checked === true)}
          />
          <span className="min-w-0 flex-1 truncate">{option.label}</span>
          {option.hint ? <span className="font-mono text-xs text-muted-foreground">{option.hint}</span> : null}
        </label>
      ))}
    </div>
  );
}
