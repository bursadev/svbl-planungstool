"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckboxList } from "@/components/data/checkbox-list";
import { NumberInput } from "@/components/data/number-input";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateInstructor, type Instructor } from "@/lib/api/instructors";
import type { LocationOption } from "./options";
import { mergePreferences } from "./preferences";

const minutesMessage = "Ganze Zahl ab 0.";

const schema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, "Ungültige E-Mail-Adresse."),
  phone: z.string().trim(),
  maxTravelMinutes: z.number({ error: minutesMessage }).int(minutesMessage).min(0, minutesMessage).nullable(),
  preferredLocationIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(instructor: Instructor): FormValues {
  return {
    email: instructor.email ?? "",
    phone: instructor.phone ?? "",
    maxTravelMinutes: instructor.maxTravelMinutes,
    preferredLocationIds: instructor.preferences?.preferredLocationIds ?? [],
  };
}

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor;
  locations: LocationOption[];
};

/** «Kontakt bearbeiten»: contact fields, travel limit and the preferred Standorte of `preferences`. */
export function ContactDialog({ open, onOpenChange, instructor, locations }: ContactDialogProps) {
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
      await updateInstructor(instructor.id, {
        email: values.email === "" ? null : values.email,
        phone: values.phone === "" ? null : values.phone,
        maxTravelMinutes: values.maxTravelMinutes,
        // The API replaces the whole object: keep notes and everything else that is already set.
        preferences: mergePreferences(instructor.preferences, { preferredLocationIds: values.preferredLocationIds }),
      });
      toast.success("Ausbilder gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog title="Kontakt bearbeiten" open={open} onOpenChange={onOpenChange} form={form} onSubmit={onSubmit}>
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

      <FormField
        control={form.control}
        name="preferredLocationIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bevorzugte Standorte</FormLabel>
            <FormControl>
              <CheckboxList
                options={locations.map((location) => ({ value: location.id, label: location.name, hint: location.code }))}
                value={field.value}
                onChange={field.onChange}
                emptyText="Keine Standorte vorhanden."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
