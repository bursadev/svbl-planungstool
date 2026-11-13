"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { discardPlanningRun, type PlanningRun } from "@/lib/api/planning-runs";

/** «×» of the runs table: discards a draft run with all its drafts after a confirmation. */
export function DiscardRunButton({ run, afterDiscard }: { run: PlanningRun; afterDiscard?: "refresh" | "list" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (run.status !== "draft") return null;

  async function discard() {
    try {
      await discardPlanningRun(run.id);
      toast.success(`Planungslauf «${run.label}» verworfen`);
      if (afterDiscard === "list") router.push("/planung");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Verwerfen fehlgeschlagen.");
      throw error;
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Lauf verwerfen"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        <XIcon aria-hidden className="size-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${run.label} verwerfen?`}
        description="Bedarf, vorgeschlagene Kurse, Anmeldungen und Ausbilder-Vorschläge dieses Laufs werden gelöscht. Bereits übernommene Kurse bleiben im Zeitplan."
        confirmLabel="Verwerfen"
        destructive
        onConfirm={discard}
      />
    </>
  );
}
