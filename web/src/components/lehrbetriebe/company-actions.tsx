"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteTrainingCompany, type TrainingCompany } from "@/lib/api/training-companies";
import { CompanyDialog } from "./company-dialog";

/** «Bearbeiten» and «Löschen» in the detail header. */
export function CompanyActions({ company }: { company: TrainingCompany }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      await deleteTrainingCompany(company.id);
      toast.success("Lehrbetrieb gelöscht");
      router.push("/lernende/lehrbetriebe");
    } catch (error) {
      // 409 while Berufsbildner or Lernende still reference the company.
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
      <CompanyDialog open={editing} onOpenChange={setEditing} company={company} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`«${company.name}» löschen?`}
        description="Der Lehrbetrieb wird dauerhaft gelöscht. Solange Berufsbildner oder Lernende zugeordnet sind, ist das nicht möglich."
        onConfirm={handleDelete}
      />
    </>
  );
}
