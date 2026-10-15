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
import { Textarea } from "@/components/ui/textarea";
import { upsertSetting, type Setting } from "@/lib/api/settings";

const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

function parseJson(value: string): { ok: boolean; parsed?: unknown } {
  try {
    return { ok: true, parsed: JSON.parse(value) as unknown };
  } catch {
    return { ok: false };
  }
}

/** The value is edited as JSON text so one dialog covers numbers, flags and objects alike. */
const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Pflichtfeld.")
    .regex(KEY_PATTERN, "Nur Kleinbuchstaben, Ziffern, Punkt, Strich und Unterstrich."),
  value: z
    .string()
    .trim()
    .min(1, "Pflichtfeld.")
    .refine((value) => parseJson(value).ok, "Kein gültiges JSON.")
    .refine((value) => parseJson(value).parsed !== null, "null ist nicht erlaubt."),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(setting?: Setting): FormValues {
  return {
    key: setting?.key ?? "",
    value: setting ? JSON.stringify(setting.value, null, 2) : "",
  };
}

type SettingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Einstellung bearbeiten» (key fixed), absent for «Einstellung hinzufügen». */
  setting?: Setting;
};

export function SettingDialog({ open, onOpenChange, setting }: SettingDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(setting),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(setting));
  }, [open, setting, form]);

  async function onSubmit(values: FormValues) {
    try {
      await upsertSetting(values.key, JSON.parse(values.value) as unknown);
      toast.success("Einstellung gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={setting ? "Einstellung bearbeiten" : "Einstellung hinzufügen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <FormField
        control={form.control}
        name="key"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schlüssel</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                placeholder="z. B. planung.vorlauf-tage"
                className="font-mono"
                disabled={Boolean(setting)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wert (JSON)</FormLabel>
            <FormControl>
              <Textarea {...field} rows={5} placeholder={'z. B. 60, "text" oder {"tage": 14}'} className="font-mono" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
