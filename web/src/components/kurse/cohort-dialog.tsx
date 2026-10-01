"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { createCohort, updateCohort, type Cohort, type CreateCohort } from "@/lib/api/curriculum";
import { TRACK_LABELS, type Track } from "@/lib/format";
import { NumberInput } from "@/components/data/number-input";

const yearMessage = "Jahr zwischen 2000 und 2100.";
const year = () => z.number({ error: yearMessage }).int(yearMessage).min(2000, yearMessage).max(2100, yearMessage);

/** Mirrors `CreateCohortDto`. */
const schema = z.object({
  track: z.enum(["efz", "eba"], { error: "Ungültiger Wert." }),
  startYear: year(),
  label: z.string().trim().min(1, "Pflichtfeld."),
  expectedEndYear: year().nullable(),
});

type FormValues = z.infer<typeof schema>;

/** «2026 EFZ»: the label the dialog proposes until the user types their own. */
function proposeLabel(startYear: number, track: Track): string {
  return Number.isFinite(startYear) ? `${startYear} ${TRACK_LABELS[track]}` : "";
}

function toFormValues(defaultTrack: Track, cohort?: Cohort): FormValues {
  const startYear = cohort?.startYear ?? new Date().getFullYear();
  const track = cohort?.track ?? defaultTrack;
  return {
    track,
    startYear,
    label: cohort?.label ?? proposeLabel(startYear, track),
    expectedEndYear: cohort?.expectedEndYear ?? null,
  };
}

function toDto(values: FormValues): CreateCohort {
  return {
    track: values.track,
    startYear: values.startYear,
    label: values.label,
    expectedEndYear: values.expectedEndYear,
  };
}

type CohortDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lehrgang preselected for a new Jahrgang: the page's current switch. */
  defaultTrack: Track;
  /** Present for «Jahrgang bearbeiten», absent for «Jahrgang anlegen». */
  cohort?: Cohort;
};

export function CohortDialog({ open, onOpenChange, defaultTrack, cohort }: CohortDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(defaultTrack, cohort),
  });
  // Once the user edits the Bezeichnung, year and track changes stop rewriting it.
  const labelTouched = useRef(false);
  const [startYear, track] = useWatch({ control: form.control, name: ["startYear", "track"] });

  useEffect(() => {
    if (open) {
      labelTouched.current = false;
      form.reset(toFormValues(defaultTrack, cohort));
    }
  }, [open, defaultTrack, cohort, form]);

  useEffect(() => {
    if (!open || cohort || labelTouched.current) return;
    form.setValue("label", proposeLabel(startYear, track));
  }, [open, cohort, startYear, track, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (cohort) await updateCohort(cohort.id, toDto(values));
      else await createCohort(toDto(values));
      toast.success("Jahrgang gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409 «Das Startjahr ist bereits vergeben.»: one Jahrgang per Lehrgang and year.
      if (error instanceof ApiError && error.status === 409) {
        form.setError("startYear", { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={cohort ? "Jahrgang bearbeiten" : "Jahrgang anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="track"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lehrgang</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TRACK_LABELS).map(([value, label]) => (
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
          name="startYear"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Startjahr</FormLabel>
              <FormControl>
                <NumberInput {...field} value={value} onChange={onChange} min={2000} max={2100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bezeichnung</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                onChange={(event) => {
                  labelTouched.current = true;
                  field.onChange(event);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expectedEndYear"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel>Voraussichtliches Ende</FormLabel>
            <FormControl>
              <NumberInput
                {...field}
                value={value}
                onChange={onChange}
                min={2000}
                max={2100}
                nullable
                placeholder="optional"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
