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
import { Textarea } from "@/components/ui/textarea";
import { createSkill, updateSkill, type CreateSkill, type Skill } from "@/lib/api/skills";

/** Mirrors `CreateSkillDto`: name required, category and description optional. */
const schema = z.object({
  name: z.string().trim().min(1, "Pflichtfeld."),
  category: z.string().trim(),
  description: z.string().trim(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(skill?: Skill): FormValues {
  return {
    name: skill?.name ?? "",
    category: skill?.category ?? "",
    description: skill?.description ?? "",
    active: skill?.active ?? true,
  };
}

/** Empty optional strings go to the API as `null`, so clearing a field clears the column. */
function toDto(values: FormValues): CreateSkill {
  return {
    name: values.name,
    category: values.category || null,
    description: values.description || null,
    active: values.active,
  };
}

type SkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for «Skill bearbeiten», absent for «Skill anlegen». */
  skill?: Skill;
};

export function SkillDialog({ open, onOpenChange, skill }: SkillDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(skill),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(skill));
  }, [open, skill, form]);

  async function onSubmit(values: FormValues) {
    try {
      if (skill) await updateSkill(skill.id, toDto(values));
      else await createSkill(toDto(values));
      toast.success("Skill gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title={skill ? "Skill bearbeiten" : "Skill anlegen"}
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
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kategorie</FormLabel>
            <FormControl>
              <Input {...field} placeholder="optional" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Beschreibung</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="optional" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {skill ? (
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => <SwitchRow label="Aktiv" checked={field.value} onCheckedChange={field.onChange} />}
        />
      ) : null}
    </FormDialog>
  );
}
