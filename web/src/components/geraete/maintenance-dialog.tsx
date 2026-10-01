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
import { Textarea } from "@/components/ui/textarea";
import { addMaintenanceWindow, updateMaintenanceWindow, type MaintenanceWindow } from "@/lib/api/devices";

const dateMessage = "Datum wählen.";
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, dateMessage);

/** Mirrors `CreateMaintenanceWindowDto`; the range check mirrors the service's «Enddatum vor Startdatum». */
const schema = z
  .object({
    startsOn: isoDate,
    endsOn: isoDate,
    note: z.string().trim(),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    path: ["endsOn"],
    message: "Das Enddatum liegt vor dem Startdatum.",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(window?: MaintenanceWindow): FormValues {
  const today = format(new Date(), "yyyy-MM-dd");
  return {
    startsOn: window?.startsOn ?? today,
    endsOn: window?.endsOn ?? today,
    note: window?.note ?? "",
  };
}

type MaintenanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string | undefined;
  /** Present for «Wartungsfenster bearbeiten», absent for «Wartung erfassen». */
  window?: MaintenanceWindow;
};

export function MaintenanceDialog({ open, onOpenChange, deviceId, window }: MaintenanceDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(window) });

  useEffect(() => {
    if (open) form.reset(toFormValues(window));
  }, [open, window, form]);

  async function onSubmit(values: FormValues) {
    const dto = { startsOn: values.startsOn, endsOn: values.endsOn, note: values.note || null };
    try {
      if (window) await updateMaintenanceWindow(window.id, dto);
      else if (deviceId) await addMaintenanceWindow(deviceId, dto);
      else return;
      toast.success("Wartungsfenster gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={window ? "Wartungsfenster bearbeiten" : "Wartung erfassen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="startsOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Von</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="font-mono tabular-nums" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endsOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bis</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="font-mono tabular-nums" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
