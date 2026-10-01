"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, SwitchRow, applyApiErrors } from "@/components/form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { createCourseType, updateCourseType, type CourseType, type CreateCourseType } from "@/lib/api/course-types";
import { LANGUAGE_LABELS, TRACK_LABELS, type Language } from "@/lib/format";
import { COURSE_KIND_LABELS, WEEKDAY_RULE_LABELS } from "./labels";
import { NumberInput } from "./number-input";

const integerMessage = "Ganze Zahl ab 1.";
const LANGUAGES = Object.keys(LANGUAGE_LABELS) as Language[];
/** Radix `Select` items need a non-empty value, so «keiner» stands for `track: null`. */
const NO_TRACK = "none";

/** Mirrors `CreateCourseTypeDto`; the min ≤ max rule is the backend's 400, checked here first. */
const schema = z
  .object({
    code: z.string().trim().min(1, "Pflichtfeld."),
    name: z.string().trim().min(1, "Pflichtfeld."),
    kind: z.enum(["uk", "adult", "exam"], { error: "Ungültiger Wert." }),
    track: z.enum(["efz", "eba", NO_TRACK], { error: "Ungültiger Wert." }),
    durationDays: z.number({ error: integerMessage }).int(integerMessage).min(1, integerMessage),
    maySpanWeeks: z.boolean(),
    weekdayRule: z.enum(["weekdays", "saturday"], { error: "Ungültiger Wert." }),
    languages: z.array(z.enum(["de", "fr", "it"])).min(1, "Mindestens eine Sprache."),
    minParticipants: z.number({ error: integerMessage }).int(integerMessage).min(1, integerMessage).nullable(),
    maxParticipants: z.number({ error: integerMessage }).int(integerMessage).min(1, integerMessage),
    description: z.string().trim(),
    published: z.boolean(),
    active: z.boolean(),
  })
  .refine((values) => values.minParticipants === null || values.minParticipants <= values.maxParticipants, {
    path: ["minParticipants"],
    message: "Die Mindestteilnehmerzahl liegt über dem Maximum.",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(courseType?: CourseType): FormValues {
  return {
    code: courseType?.code ?? "",
    name: courseType?.name ?? "",
    kind: courseType?.kind ?? "uk",
    track: courseType?.track ?? (courseType ? NO_TRACK : "efz"),
    durationDays: courseType?.durationDays ?? 1,
    maySpanWeeks: courseType?.maySpanWeeks ?? false,
    weekdayRule: courseType?.weekdayRule ?? "weekdays",
    languages: courseType?.languages ?? ["de"],
    minParticipants: courseType?.minParticipants ?? null,
    maxParticipants: courseType?.maxParticipants ?? 12,
    description: courseType?.description ?? "",
    published: courseType?.published ?? false,
    active: courseType?.active ?? true,
  };
}

function toDto(values: FormValues): CreateCourseType {
  return {
    code: values.code,
    name: values.name,
    kind: values.kind,
    track: values.track === NO_TRACK ? null : values.track,
    durationDays: values.durationDays,
    maySpanWeeks: values.maySpanWeeks,
    weekdayRule: values.weekdayRule,
    languages: values.languages,
    minParticipants: values.minParticipants,
    maxParticipants: values.maxParticipants,
    description: values.description === "" ? null : values.description,
    published: values.published,
    active: values.active,
  };
}

type CourseTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Kurstyp bearbeiten», absent for «Kurstyp anlegen». */
  courseType?: CourseType;
};

/** Create and edit share this wide dialog; requirements have their own («Anforderungen»). */
export function CourseTypeDialog({ open, onOpenChange, courseType }: CourseTypeDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(courseType),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(courseType));
  }, [open, courseType, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (courseType) await updateCourseType(courseType.id, toDto(values));
      else await createCourseType(toDto(values));
      toast.success("Kurstyp gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      // 409 «Code ist bereits vergeben.»: the code is the only unique column.
      if (error instanceof ApiError && error.status === 409) {
        form.setError("code", { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={courseType ? "Kurstyp bearbeiten" : "Kurstyp anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      width="wide"
    >
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Art</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(COURSE_KIND_LABELS).map(([value, label]) => (
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
                  <SelectItem value={NO_TRACK}>keiner</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="durationDays"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Dauer in Tagen</FormLabel>
              <FormControl>
                <NumberInput {...field} value={value} onChange={onChange} min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="weekdayRule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wochentagsregel</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(WEEKDAY_RULE_LABELS).map(([value, label]) => (
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
          name="maySpanWeeks"
          render={({ field }) => (
            <SwitchRow label="Wochenübergreifend" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sprachen</FormLabel>
            <div className="flex h-8 flex-wrap items-center gap-x-5 gap-y-2">
              {LANGUAGES.map((language) => (
                <label key={language} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value.includes(language)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked === true
                          ? LANGUAGES.filter((l) => l === language || field.value.includes(l))
                          : field.value.filter((l) => l !== language),
                      )
                    }
                  />
                  {LANGUAGE_LABELS[language]}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="minParticipants"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Min. Teilnehmer</FormLabel>
              <FormControl>
                <NumberInput {...field} value={value} onChange={onChange} min={1} nullable placeholder="optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Max. Teilnehmer</FormLabel>
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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Beschreibung</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} className="min-h-0" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <SwitchRow label="Veröffentlicht" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        {courseType ? (
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
          />
        ) : null}
      </div>
    </FormDialog>
  );
}
