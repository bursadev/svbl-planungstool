"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "./customer-dialog";

/** «Kunde anlegen» in the page header; opens the create dialog. */
export function CreateCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Kunde anlegen
      </Button>
      <CustomerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
