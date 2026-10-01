"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, SwitchRow, applyApiErrors } from "@/components/form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import type { CourseType } from "@/lib/api/course-types";
import {
  createCurriculumModule,
  updateCurriculumModule,
  type CreateCurriculumModule,
  type CurriculumModule,
} from "@/lib/api/curriculum";
import { TRACK_LABELS, type Track } from "@/lib/format";
import { CheckboxList } from "@/components/data/checkbox-list";
import { NumberInput } from "@/components/data/number-input";

const SEMESTERS = [1, 2, 3, 4, 5, 6];
const integerMessage = "Ganze Zahl ab 1.";
const semesterMessage = "Semester 1 bis 6.";

/** Mirrors `CreateCurriculumModuleDto`; the track comes from the page's switch. */
const schema = z.object({
  courseTypeId: z.string().min(1, "Pflichtfeld."),
  semester: z.number({ error: semesterMessage }).int(semesterMessage).min(1, semesterMessage).max(6, semesterMessage),
  sequence: z.number({ error: integerMessage }).int(integerMessage).min(1, integerMessage),
  prerequisiteModuleIds: z.array(z.string()),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(nextSequence: number, module?: CurriculumModule): FormValues {
  return {
    courseTypeId: module?.courseType.id ?? "",
    semester: module?.semester ?? 1,
    sequence: module?.sequence ?? nextSequence,
    prerequisiteModuleIds: module?.prerequisites.map((prerequisite) => prerequisite.id) ?? [],
    active: module?.active ?? true,
  };
}

type ModuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  /** Every Kurstyp; the dialog offers the free ÜK types of this Lehrgang. */
  courseTypes: CourseType[];
  /** Modules of this Lehrgang, for the prerequisite picker and the next free Reihenfolge. */
  modules: CurriculumModule[];
  /** Present for «Modul bearbeiten», absent for «Modul anlegen». */
  module?: CurriculumModule;
};

export function ModuleDialog({ open, onOpenChange, track, courseTypes, modules, module }: ModuleDialogProps) {
  const router = useRouter();
  const nextSequence = modules.reduce((max, m) => Math.max(max, m.sequence), 0) + 1;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(nextSequence, module),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(nextSequence, module));
  }, [open, module, nextSequence, form]);

  // Each ÜK type fills at most one slot; the edited module keeps its own type in the list.
  const courseTypeOptions = courseTypes.filter(
    (courseType) =>
      courseType.kind === "uk" &&
      courseType.track === track &&
      (courseType.curriculumModule === null || courseType.id === module?.courseType.id),
  );
  const prerequisiteOptions = modules
    .filter((candidate) => candidate.id !== module?.id)
    .map((candidate) => ({
      value: candidate.id,
      label: (
        <>
          <span className="font-mono text-xs text-muted-foreground">{candidate.courseType.code}</span>{" "}
          {candidate.courseType.name}
        </>
      ),
      hint: `Semester ${candidate.semester}`,
    }));

  async function onSubmit(values: FormValues) {
    const dto: CreateCurriculumModule = { track, ...values };
    try {
      if (module) await updateCurriculumModule(module.id, dto);
      else await createCurriculumModule(dto);
      toast.success("Modul gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409: «Die Reihenfolge ist bereits vergeben.» or «Der Kurstyp ist bereits vergeben.»
      if (error instanceof ApiError && error.status === 409) {
        const field = error.message.includes("Reihenfolge") ? "sequence" : "courseTypeId";
        form.setError(field, { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={module ? "Modul bearbeiten" : "Modul anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid gap-2">
        <Label htmlFor="module-track">Lehrgang</Label>
        <Input id="module-track" value={TRACK_LABELS[track]} readOnly disabled className="font-mono" />
      </div>

      <FormField
        control={form.control}
        name="courseTypeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kurstyp</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kurstyp wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {courseTypeOptions.map((courseType) => (
                  <SelectItem key={courseType.id} value={courseType.id}>
                    <span className="font-mono text-xs text-muted-foreground">{courseType.code}</span>
                    {courseType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courseTypeOptions.length === 0 ? (
              <FormDescription>
                Kein freier ÜK-Kurstyp für {TRACK_LABELS[track]}. Legen Sie zuerst einen Kurstyp mit Art «ÜK» und
                diesem Lehrgang an.
              </FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger className="w-full font-mono tabular-nums">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SEMESTERS.map((semester) => (
                    <SelectItem key={semester} value={String(semester)} className="font-mono tabular-nums">
                      {semester}
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
          name="sequence"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Reihenfolge</FormLabel>
              <FormControl>
                <NumberInput {...field} value={value} onChange={onChange} min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="prerequisiteModuleIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Voraussetzungen</FormLabel>
            <CheckboxList
              options={prerequisiteOptions}
              value={field.value}
              onChange={field.onChange}
              emptyText="Noch keine anderen Module in diesem Lehrgang."
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {module ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
