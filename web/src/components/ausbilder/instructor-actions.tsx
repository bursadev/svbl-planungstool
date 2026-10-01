"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteInstructor, type Instructor } from "@/lib/api/instructors";
import { InstructorDialog } from "./instructor-dialog";
import type { LocationOption } from "./options";

type InstructorActionsProps = {
  instructor: Instructor;
  locations: LocationOption[];
};

/** «Bearbeiten» and «Löschen» in the detail header. */
export function InstructorActions({ instructor, locations }: InstructorActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const name = `${instructor.firstName} ${instructor.lastName}`;

  async function handleDelete() {
    try {
      await deleteInstructor(instructor.id);
      toast.success("Ausbilder gelöscht");
      router.push("/ausbilder");
    } catch (error) {
      // 409 while assignments reference the Ausbilder: the API message names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon data-icon="inline-start" />
        Bearbeiten
      </Button>
      <Button variant="destructive" onClick={() => setDeleting(true)}>
        <Trash2Icon data-icon="inline-start" />
        Löschen
      </Button>
      <InstructorDialog open={editing} onOpenChange={setEditing} locations={locations} instructor={instructor} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`«${name}» löschen?`}
        description="Der Ausbilder wird dauerhaft gelöscht, inklusive Skills, Zertifikate und Absenzen."
        onConfirm={handleDelete}
      />
    </>
  );
}
