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
import type { CertificateType } from "@/lib/api/certificate-types";
import { ApiError } from "@/lib/api/client";
import {
  createDeviceType,
  replaceDeviceTypeQualifications,
  updateDeviceType,
  type CreateDeviceType,
  type DeviceType,
} from "@/lib/api/device-types";
import type { Skill } from "@/lib/api/skills";
import { CheckboxList } from "./checkbox-list";
import { DEVICE_CATEGORY_LABELS } from "./labels";

/** Mirrors `CreateDeviceTypeDto`; the id arrays go to the separate PUT. */
const schema = z.object({
  code: z.string().trim().min(1, "Pflichtfeld."),
  name: z.string().trim().min(1, "Pflichtfeld."),
  category: z.enum(["forklift", "aerial_platform", "crane", "other"], { error: "Ungültiger Wert." }),
  active: z.boolean(),
  certificateTypeIds: z.array(z.string()),
  skillIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(type?: DeviceType): FormValues {
  return {
    code: type?.code ?? "",
    name: type?.name ?? "",
    category: type?.category ?? "forklift",
    active: type?.active ?? true,
    certificateTypeIds: type?.qualifications.certificateTypes.map((c) => c.id) ?? [],
    skillIds: type?.qualifications.skills.map((s) => s.id) ?? [],
  };
}

function toDto(values: FormValues): CreateDeviceType {
  return { code: values.code, name: values.name, category: values.category, active: values.active };
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

type DeviceTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Gerätetyp bearbeiten», absent for «Gerätetyp anlegen». */
  type?: DeviceType;
  certificateTypes: CertificateType[];
  skills: Skill[];
};

/** Create: POST then PUT the qualifications; edit: PATCH then PUT when a selection changed. */
export function DeviceTypeDialog({ open, onOpenChange, type, certificateTypes, skills }: DeviceTypeDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(type),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(type));
  }, [open, type, form]);

  async function onSubmit(values: FormValues) {
    let saved: DeviceType;
    try {
      saved = type ? await updateDeviceType(type.id, toDto(values)) : await createDeviceType(toDto(values));
    } catch (error) {
      applyApiErrors(form, error);
      return;
    }

    const currentCertificates = type?.qualifications.certificateTypes.map((c) => c.id) ?? [];
    const currentSkills = type?.qualifications.skills.map((s) => s.id) ?? [];
    if (!sameIds(currentCertificates, values.certificateTypeIds) || !sameIds(currentSkills, values.skillIds)) {
      try {
        await replaceDeviceTypeQualifications(saved.id, {
          certificateTypeIds: values.certificateTypeIds,
          skillIds: values.skillIds,
        });
      } catch (error) {
        // The type itself is saved; only the qualifications were rejected.
        const message = error instanceof ApiError ? error.message : "Unerwarteter Fehler.";
        toast.error(`Gerätetyp gespeichert, Qualifikation nicht übernommen: ${message}`);
        onOpenChange(false);
        router.refresh();
        return;
      }
    }

    toast.success("Gerätetyp gespeichert");
    onOpenChange(false);
    router.refresh();
  }

  // Inactive catalogue entries stay selectable only while they are already assigned.
  const certificateOptions = certificateTypes.map((c) => ({ id: c.id, label: c.name, hint: c.code }));
  const assignedSkills = new Set(type?.qualifications.skills.map((s) => s.id) ?? []);
  const skillOptions = skills
    .filter((s) => s.active || assignedSkills.has(s.id))
    .map((s) => ({ id: s.id, label: s.name, hint: s.category ?? undefined }));

  return (
    <FormDialog
      title={type ? "Gerätetyp bearbeiten" : "Gerätetyp anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
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

      <div className={type ? "grid grid-cols-2 gap-3" : undefined}>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorie</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DEVICE_CATEGORY_LABELS).map(([value, label]) => (
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
        {type ? (
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        ) : null}
      </div>

      <FormField
        control={form.control}
        name="certificateTypeIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Qualifizierende Zertifikatstypen</FormLabel>
            <CheckboxList
              options={certificateOptions}
              value={field.value}
              onChange={field.onChange}
              emptyText="Noch keine Zertifikatstypen erfasst."
              className="max-h-36"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="skillIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Qualifizierende Skills</FormLabel>
            <CheckboxList
              options={skillOptions}
              value={field.value}
              onChange={field.onChange}
              emptyText="Noch keine Skills erfasst."
              className="max-h-36"
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
