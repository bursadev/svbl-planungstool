"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckboxList } from "@/components/data/checkbox-list";
import { NumberInput } from "@/components/data/number-input";
import { FormDialog, SwitchRow, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createInstructor,
  updateInstructor,
  type CreateInstructor,
  type Instructor,
  type UpdateInstructor,
} from "@/lib/api/instructors";
import { EMPLOYMENT_TYPE_LABELS, LANGUAGES, LANGUAGE_LABELS } from "./labels";
import type { LocationOption } from "./options";

const optionalText = z.string().trim();
const minutesMessage = "Ganze Zahl ab 0.";
const hoursMessage = "Zahl ab 0.";

/**
 * Mirrors `CreateInstructorDto`: names required, e-mail optional but valid, at least one language,
 * numbers ≥ 0 (travel time integer). `active` maps onto `status`.
 */
const schema = z.object({
  firstName: z.string().trim().min(1, "Pflichtfeld."),
  lastName: z.string().trim().min(1, "Pflichtfeld."),
  email: optionalText.refine((value) => value === "" || z.email().safeParse(value).success, "Ungültige E-Mail-Adresse."),
  phone: optionalText,
  employmentType: z.enum(["employee", "freelancer"], { error: "Ungültiger Wert." }),
  homeLocationId: z.string().min(1, "Pflichtfeld."),
  languages: z.array(z.enum(["de", "fr", "it"])).min(1, "Mindestens eine Sprache."),
  maxTravelMinutes: z.number({ error: minutesMessage }).int(minutesMessage).min(0, minutesMessage).nullable(),
  weeklyHours: z.number({ error: hoursMessage }).min(0, hoursMessage).nullable(),
  overtimeCapHours: z.number({ error: hoursMessage }).min(0, hoursMessage).nullable(),
  externalRef: optionalText,
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(instructor?: Instructor): FormValues {
  return {
    firstName: instructor?.firstName ?? "",
    lastName: instructor?.lastName ?? "",
    email: instructor?.email ?? "",
    phone: instructor?.phone ?? "",
    employmentType: instructor?.employmentType ?? "employee",
    homeLocationId: instructor?.homeLocation.id ?? "",
    languages: instructor?.languages ?? ["de"],
    maxTravelMinutes: instructor?.maxTravelMinutes ?? null,
    weeklyHours: instructor?.weeklyHours ?? null,
    overtimeCapHours: instructor?.overtimeCapHours ?? null,
    externalRef: instructor?.externalRef ?? "",
    active: instructor ? instructor.status === "active" : true,
  };
}

const text = (value: string) => (value === "" ? null : value);

/** The fields of «Ausbilder anlegen»; empty optional strings go to the API as `null`. */
function toCreateDto(values: FormValues): CreateInstructor {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: text(values.email),
    phone: text(values.phone),
    employmentType: values.employmentType,
    homeLocationId: values.homeLocationId,
    languages: LANGUAGES.filter((language) => values.languages.includes(language)),
    maxTravelMinutes: values.maxTravelMinutes,
  };
}

/** «Bearbeiten» additionally sends status, hours and the external reference; never `preferences`. */
function toUpdateDto(values: FormValues): UpdateInstructor {
  return {
    ...toCreateDto(values),
    weeklyHours: values.weeklyHours,
    overtimeCapHours: values.overtimeCapHours,
    externalRef: text(values.externalRef),
    status: values.active ? "active" : "inactive",
  };
}

type InstructorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: LocationOption[];
  /** Present for «Ausbilder bearbeiten», absent for «Ausbilder anlegen». */
  instructor?: Instructor;
  /** Where to go after a successful create (default: the new Ausbilder's detail page). */
  onCreated?: (instructor: Instructor) => void;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function InstructorDialog({ open, onOpenChange, locations, instructor, onCreated }: InstructorDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(instructor),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(instructor));
  }, [open, instructor, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (instructor) {
        await updateInstructor(instructor.id, toUpdateDto(values));
        toast.success("Ausbilder gespeichert");
        onOpenChange(false);
        router.refresh();
      } else {
        const created = await createInstructor(toCreateDto(values));
        toast.success("Ausbilder gespeichert");
        onOpenChange(false);
        if (onCreated) onCreated(created);
        else router.push(`/ausbilder/${created.id}`);
        router.refresh();
      }
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={instructor ? "Ausbilder bearbeiten" : "Ausbilder anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nachname</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input {...field} type="tel" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anstellung</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
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
          name="homeLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heimstandort</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Standort wählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
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
      </div>

      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sprachen</FormLabel>
            <FormControl>
              <CheckboxList
                layout="inline"
                options={LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_LABELS[language] }))}
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="maxTravelMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max. Reisezeit (Minuten)</FormLabel>
              <FormControl>
                <NumberInput {...field} min={0} step={5} inputMode="numeric" placeholder="optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {instructor ? (
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        ) : null}
      </div>

      {instructor ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="weeklyHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wochenstunden</FormLabel>
                  <FormControl>
                    <NumberInput {...field} min={0} step={0.5} placeholder="optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overtimeCapHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Überstundenlimit (h)</FormLabel>
                  <FormControl>
                    <NumberInput {...field} min={0} step={0.5} placeholder="optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="externalRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Externe Referenz</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" placeholder="z. B. Personalnummer" className="font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </FormDialog>
  );
}
