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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import {
  createTimeWindow,
  updateTimeWindow,
  type Cohort,
  type CreateTimeWindow,
  type CurriculumModule,
  type TimeWindow,
} from "@/lib/api/curriculum";
import type { Location } from "@/lib/api/locations";

/** Radix `Select` items need a non-empty value, so «Alle Standorte» travels as this sentinel. */
const ALL_LOCATIONS = "all";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const dateMessage = "Datum wählen.";

/** Mirrors `CreateTimeWindowDto`; the period rule is the backend's 400, checked here first. */
const schema = z
  .object({
    curriculumModuleId: z.string().min(1, "Pflichtfeld."),
    startsOn: z.string().regex(ISO_DATE, dateMessage),
    endsOn: z.string().regex(ISO_DATE, dateMessage),
    locationId: z.string(),
    note: z.string().trim(),
  })
  .refine((values) => values.startsOn <= values.endsOn, {
    path: ["endsOn"],
    message: "Das Enddatum liegt vor dem Startdatum.",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(timeWindow?: TimeWindow): FormValues {
  return {
    curriculumModuleId: timeWindow?.curriculumModule.id ?? "",
    startsOn: timeWindow?.startsOn ?? "",
    endsOn: timeWindow?.endsOn ?? "",
    locationId: timeWindow?.location?.id ?? ALL_LOCATIONS,
    note: timeWindow?.note ?? "",
  };
}

/** The cohort is fixed per dialog and only sent on create. */
function toDto(values: FormValues, cohortId: string): CreateTimeWindow {
  return {
    curriculumModuleId: values.curriculumModuleId,
    cohortId,
    startsOn: values.startsOn,
    endsOn: values.endsOn,
    locationId: values.locationId === ALL_LOCATIONS ? null : values.locationId,
    note: values.note === "" ? null : values.note,
  };
}

type TimeWindowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Jahrgang the window belongs to; fixed in the dialog. */
  cohort: Cohort;
  /** Modules of the cohort's Lehrgang. */
  modules: CurriculumModule[];
  locations: Location[];
  /** Present for «Zeitfenster bearbeiten», absent for «Zeitfenster anlegen». */
  timeWindow?: TimeWindow;
};

export function TimeWindowDialog({ open, onOpenChange, cohort, modules, locations, timeWindow }: TimeWindowDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(timeWindow),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(timeWindow));
  }, [open, timeWindow, form]);

  // Inactive Standorte stay selectable only while the window still points at them.
  const locationOptions = locations.filter((location) => location.active || location.id === timeWindow?.location?.id);

  async function onSubmit(values: FormValues) {
    try {
      const dto = toDto(values, cohort.id);
      if (timeWindow) {
        const { cohortId: _unchanged, ...changes } = dto;
        void _unchanged;
        await updateTimeWindow(timeWindow.id, changes);
      } else {
        await createTimeWindow(dto);
      }
      toast.success("Zeitfenster gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409: the (Modul, Jahrgang, Standort) combination already has a window.
      if (error instanceof ApiError && error.status === 409) {
        form.setError(
          "curriculumModuleId",
          { type: "server", message: "Für dieses Modul, diesen Jahrgang und Standort gibt es bereits ein Zeitfenster." },
          { shouldFocus: true },
        );
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={timeWindow ? "Zeitfenster bearbeiten" : "Zeitfenster anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="curriculumModuleId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modul</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Modul wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    <span className="font-mono text-xs text-muted-foreground">{module.courseType.code}</span>
                    {module.courseType.name}
                    <span className="text-xs text-muted-foreground">Semester {module.semester}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-2">
        <Label htmlFor="time-window-cohort">Jahrgang</Label>
        <Input id="time-window-cohort" value={cohort.label} readOnly disabled />
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
        name="locationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Standort</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={ALL_LOCATIONS}>Alle Standorte</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <span className="font-mono text-xs text-muted-foreground">{location.code}</span>
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
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notiz</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
