"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAvailability,
  updateAvailability,
  type Availability,
  type AvailabilityKind,
  type AvailabilityStatus,
  type CreateAvailability,
} from "@/lib/api/instructors";
import { AVAILABILITY_KIND_LABELS, AVAILABILITY_STATUS_LABELS } from "@/lib/labels";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Mirrors `CreateAvailabilityDto` plus the backend's period check («Das Enddatum liegt vor dem Startdatum.»). */
const schema = z
  .object({
    kind: z.enum(["vacation", "training", "sick", "blocked", "available"], { error: "Ungültiger Wert." }),
    startsOn: z.string().regex(DATE, "Pflichtfeld."),
    endsOn: z.string().regex(DATE, "Pflichtfeld."),
    status: z.enum(["requested", "approved", "rejected"], { error: "Ungültiger Wert." }),
    note: z.string().trim(),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    path: ["endsOn"],
    message: "Das Enddatum liegt vor dem Startdatum.",
  });

type FormValues = z.infer<typeof schema>;

/** The API's default: vacation needs approval, everything else is approved as entered. */
function defaultStatus(kind: AvailabilityKind): AvailabilityStatus {
  return kind === "vacation" ? "requested" : "approved";
}

function toFormValues(availability?: Availability): FormValues {
  return {
    kind: availability?.kind ?? "vacation",
    startsOn: availability?.startsOn ?? "",
    endsOn: availability?.endsOn ?? "",
    status: availability?.status ?? defaultStatus("vacation"),
    note: availability?.note ?? "",
  };
}

function toDto(values: FormValues): CreateAvailability {
  return {
    kind: values.kind,
    startsOn: values.startsOn,
    endsOn: values.endsOn,
    status: values.status,
    note: values.note === "" ? null : values.note,
  };
}

type AvailabilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  /** Present for «Absenz bearbeiten», absent for «Absenz erfassen». */
  availability?: Availability;
};

export function AvailabilityDialog({ open, onOpenChange, instructorId, availability }: AvailabilityDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(availability),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(availability));
  }, [open, availability, form]);

  // «abgelehnt» is a decision, not something to enter; it stays selectable only where it already is.
  const statusOptions: AvailabilityStatus[] =
    availability?.status === "rejected" ? ["requested", "approved", "rejected"] : ["requested", "approved"];

  async function onSubmit(values: FormValues) {
    try {
      if (availability) await updateAvailability(availability.id, toDto(values));
      else await createAvailability(instructorId, toDto(values));
      toast.success("Absenz gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={availability ? "Absenz bearbeiten" : "Absenz erfassen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Art</FormLabel>
              <Select
                value={field.value}
                onValueChange={(kind: AvailabilityKind) => {
                  field.onChange(kind);
                  // On create the status follows the kind until the user picks one themselves.
                  if (!availability && !form.getFieldState("status").isDirty) {
                    form.setValue("status", defaultStatus(kind));
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(AVAILABILITY_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {AVAILABILITY_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
