"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  /** `null` for an empty field. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** An empty field becomes `null` (optional numbers) instead of `NaN`, which lets a `z.number()` schema report its own message. */
  nullable?: boolean;
};

/**
 * `<Input type="number">` for react-hook-form number fields: everything typed becomes
 * `valueAsNumber`; a cleared field becomes `NaN`, or `null` when `nullable`. Integers by default;
 * pass `step` / `inputMode` for decimals. Spread the rest of `field` (name, ref, onBlur) onto it.
 */
export function NumberInput({ value, onChange, nullable = false, className, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      step={1}
      inputMode="numeric"
      {...props}
      value={value === null || Number.isNaN(value) ? "" : value}
      onChange={(event) =>
        onChange(event.target.value === "" ? (nullable ? null : Number.NaN) : event.target.valueAsNumber)
      }
      className={cn("font-mono tabular-nums", className)}
    />
  );
}
