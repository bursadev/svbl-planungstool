"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { createPlanningRun, type PlanningRun } from "@/lib/api/planning-runs";
import { cn } from "@/lib/utils";
import { formatPeriod, semesterPeriods } from "./labels";

/** School years offered: the running one and the next two. */
function schoolYears(): number[] {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return [start, start + 1, start + 2];
}

/** «Neuen Planungslauf starten»: school year and semester; warns when the period already has a run. */
export function NewRunDialog({ existing }: { existing: Pick<PlanningRun, "label" | "periodStartsOn" | "periodEndsOn" | "status">[] }) {
  const router = useRouter();
  const years = useMemo(() => schoolYears(), []);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(years[0]));
  const [periodIndex, setPeriodIndex] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periods = semesterPeriods(Number(year));
  const period = periods[Number(periodIndex)] ?? periods[0];
  const duplicate = existing.find(
    (run) => run.status !== "discarded" && run.periodStartsOn === period.periodStartsOn && run.periodEndsOn === period.periodEndsOn,
  );

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const run = await createPlanningRun({ periodStartsOn: period.periodStartsOn, periodEndsOn: period.periodEndsOn });
      toast.success(`Planungslauf «${run.label}» angelegt`);
      setOpen(false);
      router.push(`/planung/${run.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Der Planungslauf konnte nicht angelegt werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Neuen Planungslauf starten</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Neuen Planungslauf starten</DialogTitle>
          <DialogDescription>Ein Lauf plant ein Semester: Bedarf aus den Jahrgängen, Kurse in die Zeitfenster, Ausbilder auf die Kurse.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Schuljahr</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}/{String(y + 1).slice(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Periode</Label>
            <Select value={periodIndex} onValueChange={setPeriodIndex}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p, index) => (
                  <SelectItem key={p.label} value={String(index)}>
                    {p.label} · {formatPeriod(p.periodStartsOn, p.periodEndsOn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            className={cn("rounded-lg px-3 py-2 text-xs", duplicate || error ? "bg-warn-soft text-foreground" : "bg-muted text-muted-foreground")}
            role={error ? "alert" : undefined}
          >
            {error
              ? error
              : duplicate
                ? `Für ${period.label} existiert bereits der Lauf «${duplicate.label}» – er wird nicht überschrieben.`
                : `Der Bedarf wird im ersten Schritt aus den Jahrgängen und dem Bildungsplan erzeugt. Zeitfenster: ${formatPeriod(period.periodStartsOn, period.periodEndsOn)}.`}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button type="button" disabled={busy || Boolean(duplicate)} onClick={submit}>
            Planungslauf anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
