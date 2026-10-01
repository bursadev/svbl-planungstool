"use client";

import type { CourseType } from "@/lib/api/course-types";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { applyApiErrors } from "@/components/form/api-errors";
import { FormDialog } from "@/components/form/form-dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createCertificateType,
  replaceMaintenanceCourseTypes,
  updateCertificateType,
  type CertificateType,
  type CreateCertificateType,
} from "@/lib/api/certificate-types";
import { ApiError } from "@/lib/api/client";
import { CheckboxList } from "@/components/data/checkbox-list";

const validityMessage = "Ganze Zahl von 1 bis 50.";
const warningMessage = "Ganze Zahl von 1 bis 365.";
const maintenanceMessage = "Ganze Zahl ab 1.";

/** Mirrors `CreateCertificateTypeDto`; `courseTypeIds` goes to the separate PUT. */
const schema = z.object({
  code: z.string().trim().min(1, "Pflichtfeld."),
  name: z.string().trim().min(1, "Pflichtfeld."),
  issuer: z.string().trim(),
  validityYears: z
    .number({ error: validityMessage })
    .int(validityMessage)
    .min(1, validityMessage)
    .max(50, validityMessage)
    .nullable(),
  warningLeadDays: z.number({ error: warningMessage }).int(warningMessage).min(1, warningMessage).max(365, warningMessage),
  maintenanceMinPerYear: z
    .number({ error: maintenanceMessage })
    .int(maintenanceMessage)
    .min(1, maintenanceMessage)
    .nullable(),
  courseTypeIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(type?: CertificateType): FormValues {
  return {
    code: type?.code ?? "",
    name: type?.name ?? "",
    issuer: type?.issuer ?? "",
    validityYears: type?.validityYears ?? null,
    warningLeadDays: type?.warningLeadDays ?? 60,
    maintenanceMinPerYear: type?.maintenanceMinPerYear ?? null,
    courseTypeIds: type?.maintenanceCourseTypes.map((c) => c.id) ?? [],
  };
}

function toDto(values: FormValues): CreateCertificateType {
  return {
    code: values.code,
    name: values.name,
    issuer: values.issuer || null,
    validityYears: values.validityYears,
    warningLeadDays: values.warningLeadDays,
    maintenanceMinPerYear: values.maintenanceMinPerYear,
  };
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

type CertificateTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Zertifikatstyp bearbeiten», absent for «Zertifikatstyp anlegen». */
  type?: CertificateType;
  /** Kurstypen for the Pflichtkurse picker; `null` when they could not be loaded. */
  courseTypes: Pick<CourseType, "id" | "code" | "name">[] | null;
};

/** Create: POST then PUT the course types; edit: PATCH then PUT when the selection changed. */
export function CertificateTypeDialog({ open, onOpenChange, type, courseTypes }: CertificateTypeDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(type),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(type));
  }, [open, type, form]);

  async function onSubmit(values: FormValues) {
    let saved: CertificateType;
    try {
      saved = type ? await updateCertificateType(type.id, toDto(values)) : await createCertificateType(toDto(values));
    } catch (error) {
      applyApiErrors(form, error);
      return;
    }

    const current = type?.maintenanceCourseTypes.map((c) => c.id) ?? [];
    if (!sameIds(current, values.courseTypeIds)) {
      try {
        await replaceMaintenanceCourseTypes(saved.id, values.courseTypeIds);
      } catch (error) {
        // The type itself is saved; only the course types were rejected.
        const message = error instanceof ApiError ? error.message : "Unerwarteter Fehler.";
        toast.error(`Zertifikatstyp gespeichert, Pflichtkurse nicht übernommen: ${message}`);
        onOpenChange(false);
        router.refresh();
        return;
      }
    }

    toast.success("Zertifikatstyp gespeichert");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      title={type ? "Zertifikatstyp bearbeiten" : "Zertifikatstyp anlegen"}
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

      <FormField
        control={form.control}
        name="issuer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Aussteller</FormLabel>
            <FormControl>
              <Input {...field} placeholder="optional" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="validityYears"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gültigkeit in Jahren</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  inputMode="numeric"
                  placeholder="läuft nicht ab"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value === null || Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? null : event.target.valueAsNumber)
                  }
                  className="font-mono tabular-nums"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="warningLeadDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warnfrist in Tagen</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
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

      <FormField
        control={form.control}
        name="maintenanceMinPerYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pflichtkurse pro Jahr</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder="keine Qualifikationspflege"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value === null || Number.isNaN(field.value) ? "" : field.value}
                onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.valueAsNumber)}
                className="font-mono tabular-nums"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="courseTypeIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Anrechenbare Kurstypen</FormLabel>
            <CheckboxList
              options={(courseTypes ?? []).map((c) => ({ value: c.id, label: c.name, hint: c.code }))}
              value={field.value}
              onChange={field.onChange}
              emptyText={courseTypes ? "Noch keine Kurstypen erfasst." : "Kurstypen konnten nicht geladen werden."}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
