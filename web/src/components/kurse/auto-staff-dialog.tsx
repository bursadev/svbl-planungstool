"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusDot } from "@/components/data";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { autoStaff, type AutoStaffReport } from "@/lib/api/courses";

const ALL = "__all__";

type AutoStaffDialogProps = {
  defaultFrom: string;
  defaultTo: string;
  locations: { id: string; name: string }[];
};

/**
 * «Automatisch besetzen»: the engine staffs every unstaffed course of a range with its best
 * feasible instructor. The first run only reports («Prüfen»); «Vorschläge speichern» writes the
 * assignments as proposals the planner confirms in the drawer.
 */
export function AutoStaffDialog({ defaultFrom, defaultTo, locations }: AutoStaffDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [locationId, setLocationId] = useState(ALL);
  const [report, setReport] = useState<AutoStaffReport | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(dryRun: boolean) {
    setBusy(true);
    try {
      const result = await autoStaff({
        from,
        to,
        locationId: locationId === ALL ? undefined : locationId,
        dryRun,
      });
      setReport(result);
      if (!dryRun) {
        toast.success(`${result.staffed.length} Zuweisungen als Vorschlag gespeichert`);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Besetzung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReport(null);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Automatisch besetzen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Automatisch besetzen</DialogTitle>
          <DialogDescription>
            Die Engine prüft für jeden Kurs ohne Ausbilder Skills, Zertifikate an jedem Kurstag, Sprache und
            Verfügbarkeit und wählt den Kandidaten mit dem höchsten Score. Zuerst prüfen, dann speichern.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="auto-staff-from">Von</Label>
            <Input
              id="auto-staff-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auto-staff-to">Bis</Label>
            <Input
              id="auto-staff-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
          <div className="col-span-2 grid gap-2">
            <Label>Standort</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Alle Standorte</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {report ? <Report report={report} /> : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy || !from || !to} onClick={() => run(true)}>
            {report ? "Erneut prüfen" : "Prüfen"}
          </Button>
          <Button
            type="button"
            disabled={busy || !report || !report.dryRun || report.staffed.length === 0}
            onClick={() => run(false)}
          >
            Vorschläge speichern{report?.dryRun && report.staffed.length ? `: ${report.staffed.length} Kurse` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Report({ report }: { report: AutoStaffReport }) {
  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-lg bg-muted/50 p-3 text-[13px]">
      <div className="text-xs text-muted-foreground">
        {report.dryRun ? "Prüfung ohne Speichern" : "Gespeichert"}: {report.staffed.length} besetzt ·{" "}
        {report.unstaffed.length} ohne machbaren Ausbilder
      </div>
      {report.staffed.map((row) => (
        <div key={row.courseId} className="flex items-baseline gap-2">
          <StatusDot tone="ok" />
          <span className="font-mono text-xs">{row.code}</span>
          <span className="text-muted-foreground">
            {row.location}
            {row.isoWeek === null ? "" : ` · KW ${row.isoWeek}`}
          </span>
          <span className="ms-auto">
            {row.instructor.firstName} {row.instructor.lastName}
          </span>
          <span className="font-mono text-xs tabular-nums">{row.score}</span>
        </div>
      ))}
      {report.unstaffed.map((row) => (
        <div key={row.courseId} className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <StatusDot tone="bad" />
            <span className="font-mono text-xs">{row.code}</span>
            <span className="text-muted-foreground">
              {row.location}
              {row.isoWeek === null ? "" : ` · KW ${row.isoWeek}`}
            </span>
          </div>
          <div className="ps-4 text-xs text-bad">{row.reason}</div>
        </div>
      ))}
    </div>
  );
}
