"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { deleteCustomer, type Customer } from "@/lib/api/customers";
import { CustomerDialog } from "./customer-dialog";

/** «Bearbeiten» and «Löschen» in the detail header. */
export function CustomerActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      await deleteCustomer(customer.id);
      toast.success("Kunde gelöscht");
      router.push("/kunden");
    } catch (error) {
      // 409 while Teilnehmende or Standorte still reference the customer.
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
      <CustomerDialog open={editing} onOpenChange={setEditing} customer={customer} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`«${customer.name}» löschen?`}
        description="Der Kunde wird dauerhaft gelöscht. Teilnehmende und Kundenstandorte müssen vorher entfernt werden."
        onConfirm={handleDelete}
      />
    </>
  );
}
