"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CheckboxListOption = {
  value: string;
  label: ReactNode;
  /** Muted text at the right edge, e.g. a code or «Semester 3». */
  hint?: ReactNode;
};

type CheckboxListProps = Omit<ComponentProps<"div">, "onChange"> & {
  options: CheckboxListOption[];
  /** Selected values; the callback keeps them in the order of `options`, so DTOs stay stable. */
  value: string[];
  onChange: (value: string[]) => void;
  /** `list`: bordered, scrollable column (pickers); `inline`: wrapping row (a few flags). */
  layout?: "list" | "inline";
  /** Shown instead of the rows when there is nothing to pick. */
  emptyText?: string;
  disabled?: boolean;
};

/**
 * Multi-select as a group of checkboxes, controlled by an array of values. Works as the child of
 * `FormControl`, which slots `id` and `aria-invalid` onto the group.
 */
export function CheckboxList({
  options,
  value,
  onChange,
  layout = "list",
  emptyText = "Keine Einträge.",
  disabled = false,
  className,
  ...props
}: CheckboxListProps) {
  const baseId = useId();
  const selected = new Set(value);

  function toggle(option: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(option);
    else next.delete(option);
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  }

  return (
    <div
      role="group"
      className={cn(
        layout === "list"
          ? "flex max-h-60 flex-col overflow-y-auto rounded-lg border border-input py-1"
          : "flex flex-wrap gap-x-5 gap-y-2",
        className,
      )}
      {...props}
    >
      {options.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        options.map((option) => {
          const id = `${baseId}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 text-sm select-none",
                layout === "list" && "px-3 py-1.5 hover:bg-muted/60 has-[:focus-visible]:bg-muted/60",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                id={id}
                checked={selected.has(option.value)}
                disabled={disabled}
                onCheckedChange={(next) => toggle(option.value, next === true)}
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.hint !== undefined ? (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{option.hint}</span>
              ) : null}
            </label>
          );
        })
      )}
    </div>
  );
}
