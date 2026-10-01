"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyApiErrors } from "@/components/form/api-errors";
import { FormDialog } from "@/components/form/form-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDeviceMove, type DeviceRow } from "@/lib/api/devices";
import { selectableOptions, type PickerOption } from "./labels";

/** Mirrors `CreateDeviceMoveDto`. */
const schema = z.object({
  toLocationId: z.string().min(1, "Pflichtfeld."),
  effectiveOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum wählen."),
  note: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

function defaultValues(): FormValues {
  return { toLocationId: "", effectiveOn: format(new Date(), "yyyy-MM-dd"), note: "" };
}

type MoveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Pick<DeviceRow, "id" | "inventoryNumber" | "currentLocation"> | undefined;
  locations: PickerOption[];
};

/** «Verschieben»: records a move to another Standort from a date on; the API rejects fixed devices. */
export function MoveDialog({ open, onOpenChange, device, locations }: MoveDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultValues() });

  useEffect(() => {
    if (open) form.reset(defaultValues());
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    if (!device) return;
    try {
      await addDeviceMove(device.id, { toLocationId: values.toLocationId, effectiveOn: values.effectiveOn, note: values.note || null });
      toast.success("Verschiebung erfasst");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409 «fest installiert» and 400 «bereits am Zielstandort» come without field errors and are toasted.
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={device ? `«${device.inventoryNumber}» verschieben` : "Gerät verschieben"}
      description={device ? `Heute in ${device.currentLocation.name}.` : undefined}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="toLocationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zielstandort</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {selectableOptions(locations).map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="effectiveOn"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gültig ab</FormLabel>
            <FormControl>
              <Input {...field} type="date" className="font-mono tabular-nums" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notiz</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} placeholder="optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
