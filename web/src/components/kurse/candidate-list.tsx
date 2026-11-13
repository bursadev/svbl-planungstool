"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/data/initials-avatar";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { assignInstructor, type Candidate, type CheckResult } from "@/lib/api/courses";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/labels";
import { firstViolation, softSummary } from "./check-list";

const FEASIBLE_SHOWN = 6;

type CandidateListProps = {
  courseId: string;
  candidates: Candidate[];
  /** False for courses that cannot take an assignment any more (cancelled, done). */
  canAssign: boolean;
};

/**
 * Handoff §5 «Kandidaten»: up to six feasible instructors with score and reasons and a button
 * «Zuweisen»; the infeasible ones collapsed with their violated rule. A 409 of the assignment
 * check offers «Trotzdem zuweisen», which sends `force: true`.
 */
export function CandidateList({ courseId, candidates, canAssign }: CandidateListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [force, setForce] = useState<{ candidate: Candidate; reason: string } | null>(null);
  const feasible = candidates.filter((c) => c.result.ok);
  const infeasible = candidates.filter((c) => !c.result.ok);

  async function assign(candidate: Candidate, forced = false) {
    setPending(candidate.instructor.id);
    try {
      await assignInstructor(courseId, { instructorId: candidate.instructor.id, force: forced });
      toast.success(`${candidate.instructor.firstName} ${candidate.instructor.lastName} zugewiesen`);
      setForce(null);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && isCheckDetails(error.details)) {
        setForce({ candidate, reason: firstViolation(error.details.checkResult) });
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Zuweisung fehlgeschlagen.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {feasible.length === 0 ? (
        <div className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">
          Kein Ausbilder erfüllt alle harten Regeln an diesen Kurstagen. Optionen: Woche verschieben, Sprache
          oder Standort wechseln, Zertifikat auffrischen.
        </div>
      ) : (
        feasible.slice(0, FEASIBLE_SHOWN).map((candidate) => (
          <CandidateRow
            key={candidate.instructor.id}
            candidate={candidate}
            pending={pending === candidate.instructor.id}
            onAssign={canAssign ? () => assign(candidate) : undefined}
          />
        ))
      )}
      {feasible.length > FEASIBLE_SHOWN ? (
        <div className="text-xs text-muted-foreground">
          {feasible.length - FEASIBLE_SHOWN} weitere machbare Kandidaten mit tieferem Score.
        </div>
      ) : null}
      {infeasible.length ? (
        <details className="text-[13px]">
          <summary className="cursor-pointer text-muted-foreground">
            {infeasible.length} weitere, nicht machbar
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {infeasible.map((candidate) => (
              <li key={candidate.instructor.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-medium">
                    {candidate.instructor.firstName} {candidate.instructor.lastName}
                  </span>
                  <span className="block truncate text-xs text-bad">{firstViolation(candidate.result)}</span>
                </span>
                {canAssign ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending !== null}
                    onClick={() => setForce({ candidate, reason: firstViolation(candidate.result) })}
                  >
                    Trotzdem
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <ConfirmDialog
        open={force !== null}
        onOpenChange={(open) => {
          if (!open) setForce(null);
        }}
        title="Harte Regel verletzt"
        description={
          force
            ? `${force.candidate.instructor.firstName} ${force.candidate.instructor.lastName}: ${force.reason}. Die Zuweisung wird mit diesem Konflikt gespeichert und erscheint rot.`
            : ""
        }
        confirmLabel="Trotzdem zuweisen"
        onConfirm={() => (force ? assign(force.candidate, true) : undefined)}
      />
    </div>
  );
}

function CandidateRow({
  candidate,
  pending,
  onAssign,
}: {
  candidate: Candidate;
  pending: boolean;
  onAssign?: () => void;
}) {
  const { instructor, result } = candidate;
  const name = `${instructor.firstName} ${instructor.lastName}`;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
      <InitialsAvatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {EMPLOYMENT_TYPE_LABELS[instructor.employmentType]} · {instructor.homeLocation.name}
        </div>
        <div className="truncate text-xs text-muted-foreground">{softSummary(result, 3) || "keine Boni"}</div>
      </div>
      <span className="font-mono text-sm tabular-nums" title="Score 0–100">
        {result.score}
      </span>
      {onAssign ? (
        <Button type="button" size="sm" disabled={pending} onClick={onAssign}>
          Zuweisen
        </Button>
      ) : null}
    </div>
  );
}

function isCheckDetails(value: unknown): value is { checkResult: CheckResult } {
  return typeof value === "object" && value !== null && "checkResult" in value;
}
