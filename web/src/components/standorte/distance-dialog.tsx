"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { NumberInput } from "@/components/data/number-input";
import { FormDialog, applyApiErrors } from "@/components/form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ApiError } from "@/lib/api";
import { deleteLocationDistance, setLocationDistance } from "@/lib/api/locations";

const minutesMessage = "Ganze Zahl zwischen 0 und 1440.";

const schema = z.object({
  travelMinutes: z
    .number({ error: minutesMessage })
    .int(minutesMessage)
    .min(0, minutesMessage)
    .max(1440, minutesMessage),
});

type FormValues = z.infer<typeof schema>;

export type DistancePair = {
  from: { id: string; name: string };
  to: { id: string; name: string };
  /** Null while no travel time is stored for the pair. */
  travelMinutes: number | null;
};

type DistanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pair: DistancePair;
};

/** Sets the travel time of one pair; stored in both directions. */
export function DistanceDialog({ open, onOpenChange, pair }: DistanceDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { travelMinutes: pair.travelMinutes ?? Number.NaN },
  });

  useEffect(() => {
    if (open) form.reset({ travelMinutes: pair.travelMinutes ?? Number.NaN });
  }, [open, pair, form]);

  async function onSubmit(values: FormValues) {
    try {
      await setLocationDistance({
        fromLocationId: pair.from.id,
        toLocationId: pair.to.id,
        travelMinutes: values.travelMinutes,
      });
      toast.success("Reisezeit gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  async function handleRemove() {
    try {
      await deleteLocationDistance(pair.from.id, pair.to.id);
      toast.success("Reisezeit entfernt");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <FormDialog
      title="Reisezeit"
      description={`${pair.from.name} – ${pair.to.name}, in beide Richtungen.`}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="travelMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reisezeit (Minuten)</FormLabel>
            <FormControl>
              <NumberInput {...field} min={0} max={1440} step={5} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {pair.travelMinutes !== null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-destructive hover:text-destructive"
          onClick={handleRemove}
        >
          Reisezeit entfernen
        </Button>
      ) : null}
    </FormDialog>
  );
}
