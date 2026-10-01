"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormDialog, applyApiErrors } from "@/components/form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  replaceCourseTypeRequirements,
  type CertificateTypeOption,
  type CourseType,
  type DeviceTypeOption,
  type ReplaceRequirements,
  type SkillOption,
} from "@/lib/api/course-types";
import { CheckboxList } from "./checkbox-list";
import { NumberInput } from "./number-input";

/** Picker lists for the dialog; `null` when that catalogue could not be loaded. */
export type RequirementOptions = {
  skills: SkillOption[] | null;
  certificateTypes: CertificateTypeOption[] | null;
  deviceTypes: DeviceTypeOption[] | null;
};

const quantityMessage = "Ganze Zahl ab 1.";

/** Mirrors `ReplaceRequirementsDto`; a device type may only appear once (the backend keeps the last). */
const schema = z
  .object({
    skillIds: z.array(z.string()),
    certificateTypeIds: z.array(z.string()),
    devices: z.array(
      z.object({
        deviceTypeId: z.string().min(1, "Gerätetyp wählen."),
        quantity: z.number({ error: quantityMessage }).int(quantityMessage).min(1, quantityMessage),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.devices.forEach((device, index) => {
      if (!device.deviceTypeId) return;
      if (seen.has(device.deviceTypeId)) {
        ctx.addIssue({
          code: "custom",
          path: ["devices", index, "deviceTypeId"],
          message: "Gerätetyp ist bereits aufgeführt.",
        });
      }
      seen.add(device.deviceTypeId);
    });
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(courseType?: CourseType): FormValues {
  return {
    skillIds: courseType?.requiredSkills.map((skill) => skill.id) ?? [],
    certificateTypeIds: courseType?.requiredCertificates.map((certificate) => certificate.id) ?? [],
    devices:
      courseType?.requiredDevices.map((device) => ({
        deviceTypeId: device.deviceType.id,
        quantity: device.quantity,
      })) ?? [],
  };
}

type RequirementsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseType?: CourseType;
  options: RequirementOptions;
};

/** «Anforderungen»: required skills, certificate types and devices with quantity, saved in one PUT. */
export function RequirementsDialog({ open, onOpenChange, courseType, options }: RequirementsDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(courseType),
  });
  const devices = useFieldArray({ control: form.control, name: "devices" });

  useEffect(() => {
    if (open) form.reset(toFormValues(courseType));
  }, [open, courseType, form]);

  // Inactive skills stay selectable only while the type still requires them.
  const requiredSkillIds = new Set(courseType?.requiredSkills.map((skill) => skill.id));
  const skillOptions = options.skills
    ?.filter((skill) => skill.active || requiredSkillIds.has(skill.id))
    .map((skill) => ({
      value: skill.id,
      label: skill.name,
      hint: skill.active ? undefined : "inaktiv",
    }));
  const certificateOptions = options.certificateTypes?.map((certificate) => ({
    value: certificate.id,
    label: (
      <>
        <span className="font-mono text-xs text-muted-foreground">{certificate.code}</span> {certificate.name}
      </>
    ),
  }));

  async function onSubmit(values: FormValues) {
    if (!courseType) return;
    const dto: ReplaceRequirements = values;
    try {
      await replaceCourseTypeRequirements(courseType.id, dto);
      toast.success("Anforderungen gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={courseType ? `Anforderungen «${courseType.code}»` : "Anforderungen"}
      description="Was ein Ausbilder mitbringen und was am Standort bereitstehen muss."
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      width="wide"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="skillIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              {skillOptions ? (
                <CheckboxList
                  options={skillOptions}
                  value={field.value}
                  onChange={field.onChange}
                  emptyText="Noch keine Skills im Katalog."
                />
              ) : (
                <UnavailableNote>Skills konnten nicht geladen werden.</UnavailableNote>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="certificateTypeIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zertifikatstypen</FormLabel>
              {certificateOptions ? (
                <CheckboxList
                  options={certificateOptions}
                  value={field.value}
                  onChange={field.onChange}
                  emptyText="Noch keine Zertifikatstypen im Katalog."
                />
              ) : (
                <UnavailableNote>Zertifikatstypen konnten nicht geladen werden.</UnavailableNote>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Geräte</p>
        {options.deviceTypes === null ? (
          <UnavailableNote>Gerätetypen konnten nicht geladen werden.</UnavailableNote>
        ) : (
          <>
            {devices.fields.length > 0 ? (
              <div className="grid grid-cols-[1fr_96px_32px] gap-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                <span>Gerätetyp</span>
                <span>Anzahl</span>
                <span />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Geräte erforderlich.</p>
            )}
            {devices.fields.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[1fr_96px_32px] items-start gap-2">
                <FormField
                  control={form.control}
                  name={`devices.${index}.deviceTypeId`}
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full" aria-label="Gerätetyp">
                            <SelectValue placeholder="Gerätetyp wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.deviceTypes?.map((deviceType) => (
                            <SelectItem key={deviceType.id} value={deviceType.id}>
                              <span className="font-mono text-xs text-muted-foreground">{deviceType.code}</span>
                              {deviceType.name}
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
                  name={`devices.${index}.quantity`}
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormControl>
                        <NumberInput {...field} value={value} onChange={onChange} min={1} aria-label="Anzahl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Gerät entfernen"
                  onClick={() => devices.remove(index)}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => devices.append({ deviceTypeId: "", quantity: 1 })}
            >
              <PlusIcon data-icon="inline-start" />
              Gerät hinzufügen
            </Button>
          </>
        )}
      </div>
    </FormDialog>
  );
}

function UnavailableNote({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed border-input px-2.5 py-2 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
