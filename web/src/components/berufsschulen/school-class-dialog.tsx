"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyApiErrors } from "@/components/form/api-errors";
import { FormDialog } from "@/components/form/form-dialog";
import { SwitchRow } from "@/components/form/switch-row";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  createSchoolClass,
  updateSchoolClass,
  type CreateSchoolClass,
  type SchoolClass,
} from "@/lib/api/vocational-schools";
import { TRACK_LABELS } from "@/lib/format";
import { currentSchoolYearStart } from "./labels";

const yearMessage = "Ganze Zahl zwischen 2000 und 2100.";

/** Mirrors `CreateSchoolClassDto`: code required, start year an integer 2000–2100. */
const schema = z.object({
  code: z.string().trim().min(1, "Pflichtfeld."),
  track: z.enum(["efz", "eba"], { error: "Ungültiger Wert." }),
  startYear: z.number({ error: yearMessage }).int(yearMessage).min(2000, yearMessage).max(2100, yearMessage),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(schoolClass?: SchoolClass): FormValues {
  return {
    code: schoolClass?.code ?? "",
    track: schoolClass?.track ?? "efz",
    startYear: schoolClass?.startYear ?? currentSchoolYearStart(),
    active: schoolClass?.active ?? true,
  };
}

function toDto(values: FormValues): CreateSchoolClass {
  return { code: values.code, track: values.track, startYear: values.startYear, active: values.active };
}

type SchoolClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  /** Present for «Klasse bearbeiten», absent for «Klasse anlegen». */
  schoolClass?: SchoolClass;
};

export function SchoolClassDialog({ open, onOpenChange, schoolId, schoolClass }: SchoolClassDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(schoolClass),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(schoolClass));
  }, [open, schoolClass, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (schoolClass) await updateSchoolClass(schoolClass.id, toDto(values));
      else await createSchoolClass(schoolId, toDto(values));
      toast.success("Klasse gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409 «Code ist an dieser Schule bereits vergeben.» belongs under the code field.
      if (error instanceof ApiError && error.status === 409) {
        form.setError("code", { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={schoolClass ? "Klasse bearbeiten" : "Klasse anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <FormControl>
              <Input {...field} placeholder="z. B. LOG26a" autoComplete="off" className="font-mono" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Startjahr</FormLabel>
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
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? Number.NaN : event.target.valueAsNumber)
                  }
                  className="font-mono tabular-nums"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {schoolClass ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
