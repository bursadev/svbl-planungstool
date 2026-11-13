"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { applyFix, listFixOptions, type FixOption, type RunCourse } from "@/lib/api/planning-runs";
import { courseSubject } from "./format";

type FixDialogProps = {
  runId: string;
  /** The course with the issue; `null` keeps the dialog closed. */
  course: RunCourse | null;
  onClose: () => void;
};

/**
 * Design «Lösungsdialog»: KONFLIKT with subject and problem, one proposal at a time («Vorschlag n von m»
 * with why and three effects), «Anderer Vorschlag» cycles, «Vorschlag übernehmen» applies the patch.
 */
export function FixDialog({ runId, course, onClose }: FixDialogProps) {
  return (
    <Dialog
      open={course !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        {course ? <FixDialogBody key={course.id} runId={runId} course={course} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Keyed by course, so every course starts with fresh options and the first proposal. */
function FixDialogBody({ runId, course, onClose }: { runId: string; course: RunCourse; onClose: () => void }) {
  const router = useRouter();
  const [options, setOptions] = useState<FixOption[] | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listFixOptions(runId, course.id)
      .then((result) => {
        if (!cancelled) setOptions(result);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof ApiError ? error.message : "Optionen konnten nicht geladen werden.");
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [runId, course.id]);

  const current = options && options.length ? Math.min(index, options.length - 1) : 0;
  const option = options && options.length ? options[current] : null;
  const problem = course.planningIssue ?? course.staffingIssue ?? "Kein Ausbilder erfüllt alle harten Regeln für diesen Kurs.";

  async function apply() {
    if (!option?.patch) return;
    setBusy(true);
    try {
      await applyFix(runId, course.id, option.index);
      toast.success(`Vorschlag übernommen: ${option.title}`);
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Vorschlag konnte nicht übernommen werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="text-[11px] font-medium tracking-[0.06em] text-bad uppercase">Konflikt</div>
        <DialogTitle className="text-base">{courseSubject(course)}</DialogTitle>
        <DialogDescription>{problem}</DialogDescription>
      </DialogHeader>
      {options === null ? (
        <div className="rounded-lg bg-muted px-4 py-6 text-center text-[13px] text-muted-foreground">
          Die Engine prüft Standorte, Wochen, Sprachen und Ausbilder …
        </div>
      ) : option ? (
        <div className="rounded-lg bg-muted px-4 py-3">
          <div className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            Vorschlag {current + 1} von {options.length}
          </div>
          <div className="mt-1 text-sm font-semibold">{option.title}</div>
          <div className="mt-2 text-[13px]">
            <span className="text-muted-foreground">Warum: </span>
            {option.why}
          </div>
          <ul className="mt-2 list-disc ps-5 text-[13px]">
            {option.effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg bg-muted px-4 py-3 text-[13px] text-muted-foreground">Keine Optionen.</div>
      )}
      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={!options || options.length < 2}
          onClick={() => setIndex(options ? (current + 1) % options.length : 0)}
        >
          Anderer Vorschlag
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          {option && !option.patch ? (
            <span className="text-xs text-muted-foreground">Braucht eine Entscheidung ausserhalb des Tools</span>
          ) : (
            <Button type="button" disabled={busy || !option?.patch} onClick={apply}>
              Vorschlag übernehmen
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}
