"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | null;
  onChange: (value: number | null) => void;
  /** An empty field becomes `null` instead of `NaN`, for optional numbers. */
  nullable?: boolean;
};

/**
 * Integer input for react-hook-form fields: a cleared field yields `NaN` so a `z.number()`
 * schema reports its own message («Ganze Zahl ab 1.»), or `null` when `nullable`.
 * Spread the rest of `field` (name, ref, onBlur) and pass `value` / `onChange` explicitly.
 */
export function NumberInput({ value, onChange, nullable = false, className, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      step={1}
      inputMode="numeric"
      value={value === null || Number.isNaN(value) ? "" : value}
      onChange={(event) =>
        onChange(event.target.value === "" ? (nullable ? null : Number.NaN) : event.target.valueAsNumber)
      }
      className={cn("font-mono tabular-nums", className)}
      {...props}
    />
  );
}
