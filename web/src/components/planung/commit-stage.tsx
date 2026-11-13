"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusDot, type StatusTone } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { commitRun, type CommitSummary, type PlanningRun } from "@/lib/api/planning-runs";

const count = new Intl.NumberFormat("de-CH");

type CommitStageProps = { run: PlanningRun; summary: CommitSummary; prevHref: string };

/** Stage 4 «Übernahme»: the balance of the run and the one button that writes it into the schedule. */
export function CommitStage({ run, summary, prevHref }: CommitStageProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const committed = run.status === "committed";
  const rows: { label: string; value: number; tone: StatusTone }[] = [
    { label: "Kurse anlegen", value: summary.toCreate, tone: "accent" },
    { label: "davon mit Ausbilder", value: summary.withInstructor, tone: "ok" },
    { label: "ohne Ausbilder", value: summary.withoutInstructor, tone: "warn" },
    { label: "nicht planbar (werden verworfen)", value: summary.unplannable, tone: "bad" },
    { label: "Lernende eingeteilt", value: summary.apprenticesPlaced, tone: "ok" },
    { label: "Lernende ohne Platz", value: summary.unassigned, tone: summary.unassigned ? "bad" : "muted" },
  ];
  const coursesHref = `/kurse?von=${run.periodStartsOn}&bis=${run.periodEndsOn}&status=planned`;

  async function commit() {
    try {
      const result = await commitRun(run.id);
      toast.success(`${result.created} Kurse in den Zeitplan übernommen`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Übernahme fehlgeschlagen.");
      throw error;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xl rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Übernahme in den Zeitplan</h2>
        <dl className="mt-3 flex flex-col gap-1.5 text-[13px]">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <StatusDot tone={row.tone} />
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="ms-auto font-mono tabular-nums">{count.format(row.value)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Kurse werden als «geplant» angelegt, Ausbilder als Vorschlag zugewiesen. Kurse ohne machbaren Ausbilder
          bleiben offen und erscheinen in der Kursliste gelb; nicht planbare Kurse werden verworfen.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={prevHref} scroll={false}>
              Zurück
            </Link>
          </Button>
          <Button type="button" disabled={committed || summary.toCreate === 0} onClick={() => setConfirmOpen(true)}>
            {committed ? "Bereits übernommen" : `Übernehmen: ${count.format(summary.toCreate)} Kurse`}
          </Button>
        </div>
      </div>
      {committed ? (
        <div className="max-w-xl rounded-xl border border-ok/30 bg-ok-soft p-4">
          <div className="text-sm font-semibold">Planungslauf übernommen</div>
          <p className="mt-1 text-[13px]">
            {count.format(summary.toCreate)} Kurse für {run.label} angelegt, {count.format(summary.withInstructor)} mit
            zugewiesenem Ausbilder.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link href={coursesHref}>Zu den Kursen</Link>
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${count.format(summary.toCreate)} Kurse übernehmen?`}
        description={`Die Kurse von ${run.label} werden als «geplant» angelegt und die Lernenden angemeldet. Danach lässt sich der Lauf nicht mehr ändern oder verwerfen.`}
        confirmLabel="Übernehmen"
        onConfirm={commit}
      />
    </div>
  );
}
