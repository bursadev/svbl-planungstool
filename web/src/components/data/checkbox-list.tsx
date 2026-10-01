"use client";

import { useId, type ComponentProps } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CheckboxListOption = {
  value: string;
  label: string;
  /** Muted text after the label, e.g. a code. */
  hint?: string;
};

type CheckboxListProps = Omit<ComponentProps<"div">, "onChange"> & {
  options: CheckboxListOption[];
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

  function toggle(option: string, checked: boolean) {
    if (checked) {
      if (!value.includes(option)) onChange([...value, option]);
    } else {
      onChange(value.filter((entry) => entry !== option));
    }
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
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 text-sm select-none",
                layout === "list" && "px-3 py-1.5 hover:bg-muted",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(next) => toggle(option.value, next === true)}
              />
              <span className="min-w-0 truncate">{option.label}</span>
              {option.hint ? <span className="font-mono text-xs text-muted-foreground">{option.hint}</span> : null}
            </label>
          );
        })
      )}
    </div>
  );
}
