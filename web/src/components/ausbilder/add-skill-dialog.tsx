"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckboxList } from "@/components/data/checkbox-list";
import { FormDialog, applyApiErrors } from "@/components/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { replaceInstructorSkills } from "@/lib/api/instructors";
import type { SkillRef } from "@/lib/api/skills-ref";

const schema = z.object({
  skillIds: z.array(z.string()).min(1, "Mindestens einen Skill wählen."),
});

type FormValues = z.infer<typeof schema>;

type AddSkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  /** Skills the Ausbilder already holds; the PUT sends their union with the picked ones. */
  heldIds: string[];
  /** Active skills not yet held. */
  options: SkillRef[];
};

/** «Skill hinzufügen»: checkbox list of the skills still available. */
export function AddSkillDialog({ open, onOpenChange, instructorId, heldIds, options }: AddSkillDialogProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { skillIds: [] },
  });

  useEffect(() => {
    if (open) form.reset({ skillIds: [] });
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    try {
      await replaceInstructorSkills(instructorId, [...new Set([...heldIds, ...values.skillIds])]);
      toast.success("Skills gespeichert");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <FormDialog
      title="Skill hinzufügen"
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      submitLabel="Hinzufügen"
    >
      <FormField
        control={form.control}
        name="skillIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Skills</FormLabel>
            <FormControl>
              <CheckboxList
                options={options.map((skill) => ({ value: skill.id, label: skill.name }))}
                value={field.value}
                onChange={field.onChange}
                emptyText="Alle aktiven Skills sind bereits zugewiesen."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
