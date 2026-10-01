"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { replaceInstructorSkills, type Instructor } from "@/lib/api/instructors";
import type { Skill } from "@/lib/api/skills";
import { AddSkillDialog } from "./add-skill-dialog";
import { SkillChip } from "./skill-chip";

type SkillsPanelProps = {
  instructor: Instructor;
  /** All skills; the picker offers the active ones the Ausbilder does not hold yet. */
  allSkills: Skill[];
};

/** Skill chips with ×, plus «Skill hinzufügen». Every change is one `PUT /instructors/:id/skills`. */
export function SkillsPanel({ instructor, allSkills }: SkillsPanelProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const heldIds = new Set(instructor.skills.map((skill) => skill.id));
  const addable = allSkills.filter((skill) => skill.active && !heldIds.has(skill.id));

  async function handleRemove(skillId: string) {
    setRemovingId(skillId);
    try {
      await replaceInstructorSkills(
        instructor.id,
        instructor.skills.filter((skill) => skill.id !== skillId).map((skill) => skill.id),
      );
      toast.success("Skill entfernt");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            Skill hinzufügen
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {instructor.skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Skills zugewiesen.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {instructor.skills.map((skill) => (
              <li key={skill.id} className="max-w-full">
                <SkillChip
                  name={skill.name}
                  disabled={removingId !== null}
                  onRemove={() => handleRemove(skill.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <AddSkillDialog
        open={adding}
        onOpenChange={setAdding}
        instructorId={instructor.id}
        heldIds={instructor.skills.map((skill) => skill.id)}
        options={addable}
      />
    </Card>
  );
}
