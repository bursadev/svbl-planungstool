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
import type { Location } from "@/lib/api/locations";
import {
  createVocationalSchool,
  updateVocationalSchool,
  type CreateVocationalSchool,
  type VocationalSchool,
} from "@/lib/api/vocational-schools";
import { LANGUAGE_LABELS } from "@/lib/format";

/** What the ÜK-Standort picker needs of a Standort; the page trims `Location` to this. */
export type LocationOption = Pick<Location, "id" | "name" | "hostsUk">;

const optionalText = z.string().trim();

/** Mirrors `CreateVocationalSchoolDto`: name, short name, language and Standort required, e-mail optional but valid. */
const schema = z.object({
  name: z.string().trim().min(1, "Pflichtfeld."),
  shortName: z.string().trim().min(1, "Pflichtfeld."),
  addressLine: optionalText,
  postalCode: optionalText,
  city: optionalText,
  canton: optionalText,
  language: z.enum(["de", "fr", "it"], { error: "Ungültiger Wert." }),
  nearestLocationId: z.string().min(1, "Pflichtfeld."),
  contactName: optionalText,
  contactEmail: optionalText.refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Ungültige E-Mail-Adresse.",
  ),
  contactPhone: optionalText,
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(school?: VocationalSchool): FormValues {
  return {
    name: school?.name ?? "",
    shortName: school?.shortName ?? "",
    addressLine: school?.addressLine ?? "",
    postalCode: school?.postalCode ?? "",
    city: school?.city ?? "",
    canton: school?.canton ?? "",
    language: school?.language ?? "de",
    nearestLocationId: school?.nearestLocation.id ?? "",
    contactName: school?.contactName ?? "",
    contactEmail: school?.contactEmail ?? "",
    contactPhone: school?.contactPhone ?? "",
    active: school?.active ?? true,
  };
}

/** Empty optional strings go to the API as `null`, so clearing a field clears the column. */
function toDto(values: FormValues): CreateVocationalSchool {
  const text = (value: string) => (value === "" ? null : value);
  return {
    name: values.name,
    shortName: values.shortName,
    addressLine: text(values.addressLine),
    postalCode: text(values.postalCode),
    city: text(values.city),
    canton: text(values.canton),
    language: values.language,
    nearestLocationId: values.nearestLocationId,
    contactName: text(values.contactName),
    contactEmail: text(values.contactEmail),
    contactPhone: text(values.contactPhone),
    active: values.active,
  };
}

/** ÜK-Standorte only (every Standort when none is flagged), plus the school's current one. */
function locationOptions(
  locations: LocationOption[],
  current?: VocationalSchool["nearestLocation"],
): { id: string; name: string }[] {
  const hosts = locations.filter((location) => location.hostsUk);
  const base = hosts.length > 0 ? hosts : locations;
  if (!current || base.some((location) => location.id === current.id)) return base;
  return [...base, current];
}

type SchoolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: LocationOption[];
  /** Present for «Berufsschule bearbeiten», absent for «Berufsschule anlegen». */
  school?: VocationalSchool;
};

/** Create and edit share this dialog; field errors from the API land under the fields. */
export function SchoolDialog({ open, onOpenChange, locations, school }: SchoolDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(school),
  });
  const options = locationOptions(locations, school?.nearestLocation);

  useEffect(() => {
    if (open) form.reset(toFormValues(school));
  }, [open, school, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (school) await updateVocationalSchool(school.id, toDto(values));
      else await createVocationalSchool(toDto(values));
      toast.success("Berufsschule gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={school ? "Berufsschule bearbeiten" : "Berufsschule anlegen"}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-[2fr_1fr] gap-3">
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
        <FormField
          control={form.control}
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kurzname</FormLabel>
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
        name="addressLine"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresse</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="street-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PLZ</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" autoComplete="postal-code" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ort</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="address-level2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="canton"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kanton</FormLabel>
              <FormControl>
                <Input {...field} placeholder="z. B. AG" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprache</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
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
      </div>

      <FormField
        control={form.control}
        name="nearestLocationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ÜK-Standort</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((location) => (
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

      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kontakt</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Name" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="contactEmail"
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
          name="contactPhone"
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

      {school ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
