"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteVocationalSchool, type VocationalSchool } from "@/lib/api/vocational-schools";
import { SchoolDialog, type LocationOption } from "./school-dialog";

/** «Bearbeiten» and «Löschen» in the detail header. */
export function SchoolActions({ school, locations }: { school: VocationalSchool; locations: LocationOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      await deleteVocationalSchool(school.id);
      toast.success("Berufsschule gelöscht");
      router.push("/berufsschulen");
    } catch (error) {
      // 409 while classes or apprentices reference the school: the API message names the reason.
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
      <SchoolDialog open={editing} onOpenChange={setEditing} locations={locations} school={school} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`«${school.name}» löschen?`}
        description="Die Berufsschule wird dauerhaft gelöscht. Solange Klassen oder Lernende zugeordnet sind, ist das nicht möglich."
        onConfirm={handleDelete}
      />
    </>
  );
}
