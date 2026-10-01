"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CheckboxOption = {
  value: string;
  label: ReactNode;
  /** Muted text at the right edge, e.g. «Semester 3». */
  hint?: ReactNode;
};

type CheckboxListProps = {
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyText?: string;
  className?: string;
};

/** Scrollable multi-select of checkboxes for pickers (Skills, Zertifikatstypen, Voraussetzungen). */
export function CheckboxList({
  options,
  value,
  onChange,
  emptyText = "Keine Einträge.",
  className,
}: CheckboxListProps) {
  const selected = new Set(value);

  function toggle(option: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(option);
    else next.delete(option);
    // Keep the options' order so the DTO is stable across toggles.
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  }

  return (
    <div role="group" className={cn("max-h-52 overflow-y-auto rounded-lg border border-input py-1", className)}>
      {options.length === 0 ? (
        <p className="px-2.5 py-1.5 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-sm hover:bg-muted/60"
          >
            <Checkbox
              checked={selected.has(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.hint !== undefined ? (
              <span className="shrink-0 text-xs text-muted-foreground">{option.hint}</span>
            ) : null}
          </label>
        ))
      )}
    </div>
  );
}
