"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  /** `null` for an empty field. */
  value: number | null;
  onChange: (value: number | null) => void;
};

/**
 * `<Input type="number">` for a `number | null` form field: empty text becomes `null`, everything
 * else `valueAsNumber`. Spread the rest of a react-hook-form `field` onto it (`name`, `ref`, `onBlur`).
 */
export function NumberInput({ value, onChange, className, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      {...props}
      value={value === null || Number.isNaN(value) ? "" : value}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.valueAsNumber)}
      className={cn("font-mono tabular-nums", className)}
    />
  );
}
