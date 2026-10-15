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
import {
  createSchoolHoliday,
  updateSchoolHoliday,
  type CreateSchoolHoliday,
  type SchoolHoliday,
} from "@/lib/api/vocational-schools";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Mirrors `CreateSchoolHolidayDto`: a date range (start ≤ end) with an optional name. */
const schema = z
  .object({
    startsOn: z.string().regex(DATE, "Pflichtfeld."),
    endsOn: z.string().regex(DATE, "Pflichtfeld."),
    name: z.string().trim(),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    path: ["endsOn"],
    message: "Das Ende liegt vor dem Beginn.",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(holiday?: SchoolHoliday): FormValues {
  return {
    startsOn: holiday?.startsOn ?? "",
    endsOn: holiday?.endsOn ?? "",
    name: holiday?.name ?? "",
  };
}

function toDto(values: FormValues): CreateSchoolHoliday {
  return {
    startsOn: values.startsOn,
    endsOn: values.endsOn,
    name: values.name === "" ? null : values.name,
  };
}

type HolidayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  /** Present for «Ferien bearbeiten», absent for «Ferien hinzufügen». */
  holiday?: SchoolHoliday;
};

export function HolidayDialog({ open, onOpenChange, schoolId, holiday }: HolidayDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(holiday),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(holiday));
  }, [open, holiday, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (holiday) await updateSchoolHoliday(holiday.id, toDto(values));
      else await createSchoolHoliday(schoolId, toDto(values));
      toast.success("Ferien gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={holiday ? "Ferien bearbeiten" : "Ferien hinzufügen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bezeichnung</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="z. B. Sommerferien" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </FormDialog>
  );
}
