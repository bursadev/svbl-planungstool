"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDialog } from "./company-dialog";

/** «Lehrbetrieb anlegen» in the page header; opens the create dialog. */
export function CreateCompanyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Lehrbetrieb anlegen
      </Button>
      <CompanyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
