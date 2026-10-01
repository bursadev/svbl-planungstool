"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyApiErrors } from "@/components/form/api-errors";
import { FormDialog } from "@/components/form/form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { replaceSchoolClassDays, type ReplaceSchoolClassDays, type SchoolClass } from "@/lib/api/vocational-schools";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/labels";
import { currentSchoolYearStart, formatSchoolYear } from "./labels";

const yearMessage = "Ganze Zahl zwischen 2000 und 2100.";

/** Mirrors `ReplaceSchoolClassDaysDto`; the seven rows are fixed, `selected` decides what is sent. */
const schema = z.object({
  schoolYearStart: z.number({ error: yearMessage }).int(yearMessage).min(2000, yearMessage).max(2100, yearMessage),
  days: z.array(
    z.object({
      weekday: z.number().int().min(1).max(7),
      selected: z.boolean(),
      evening: z.boolean(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

/** The seven weekday rows, prefilled from the class's days of the given school year. */
function daysFor(schoolClass: SchoolClass, schoolYearStart: number): FormValues["days"] {
  return WEEKDAYS.map((weekday) => {
    const day = schoolClass.days.find((d) => d.schoolYearStart === schoolYearStart && d.weekday === weekday);
    return { weekday, selected: day !== undefined, evening: day?.evening ?? false };
  });
}

function toFormValues(schoolClass: SchoolClass, schoolYearStart = currentSchoolYearStart()): FormValues {
  return { schoolYearStart, days: daysFor(schoolClass, schoolYearStart) };
}

function toDto(values: FormValues): ReplaceSchoolClassDays {
  return {
    schoolYearStart: values.schoolYearStart,
    days: values.days.filter((day) => day.selected).map(({ weekday, evening }) => ({ weekday, evening })),
  };
}

type SchoolDaysDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass: SchoolClass;
};

/** «Schultage»: the weekdays of one school year; saving replaces that year only. */
export function SchoolDaysDialog({ open, onOpenChange, schoolClass }: SchoolDaysDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(schoolClass),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(schoolClass));
  }, [open, schoolClass, form]);

  // `useWatch` instead of `form.watch`: the React Compiler can memoize around a hook subscription.
  const schoolYearStart = useWatch({ control: form.control, name: "schoolYearStart" });
  const days = useWatch({ control: form.control, name: "days" });
  const yearLabel = Number.isInteger(schoolYearStart) ? formatSchoolYear(schoolYearStart) : "–";

  async function onSubmit(values: FormValues) {
    try {
      await replaceSchoolClassDays(schoolClass.id, toDto(values));
      toast.success(`Schultage ${formatSchoolYear(values.schoolYearStart)} gespeichert`);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={`Schultage · ${schoolClass.code}`}
      description="Gilt für das gewählte Schuljahr; andere Schuljahre bleiben unverändert."
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="schoolYearStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schuljahr</FormLabel>
            <div className="flex items-center gap-3">
              <FormControl>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  step={1}
                  inputMode="numeric"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) => {
                    const next = event.target.value === "" ? Number.NaN : event.target.valueAsNumber;
                    field.onChange(next);
                    // Switching the year shows that year's days; unsaved ticks of the old year are dropped.
                    if (Number.isInteger(next)) form.setValue("days", daysFor(schoolClass, next));
                  }}
                  className="w-28 font-mono tabular-nums"
                />
              </FormControl>
              <span className="text-sm text-muted-foreground">Schuljahr {yearLabel}</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          <span>Schultag</span>
          <span>abends</span>
        </div>
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className="flex items-center justify-between gap-3">
            <FormField
              control={form.control}
              name={`days.${index}.selected`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const selected = checked === true;
                        field.onChange(selected);
                        if (!selected) form.setValue(`days.${index}.evening`, false);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{WEEKDAY_LABELS[weekday]}</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`days.${index}.evening`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={!days[index]?.selected}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-label={`${WEEKDAY_LABELS[weekday]} abends`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
