"use client";

import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

type SwitchRowProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

/**
 * Boolean field for `FormField`: label above, switch in a row of input height, so it lines up
 * with inputs in a grid. Use inside `render={({ field }) => <SwitchRow … />}`.
 */
export function SwitchRow({ label, checked, onCheckedChange, disabled }: SwitchRowProps) {
  return (
    <FormItem className="flex flex-col justify-end gap-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex h-8 items-center">
        <FormControl>
          <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
}
