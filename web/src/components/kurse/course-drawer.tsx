"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { StatusDot, type StatusTone } from "@/components/data";
import { InitialsAvatar } from "@/components/data/initials-avatar";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApiError } from "@/lib/api";
import {
  confirmAssignment,
  removeAssignment,
  type AssignmentRole,
  type Candidate,
  type CourseAssignment,
  type CourseDetail,
} from "@/lib/api/courses";
import { EMPLOYMENT_TYPE_LABELS, LANGUAGE_LABELS } from "@/lib/labels";
import { CandidateList } from "./candidate-list";
import { CheckList } from "./check-list";
import { COURSE_STATUS_LABELS, courseTone, formatDayRange } from "./course-status";

const ROLE_LABELS: Record<AssignmentRole, string> = {
  lead: "Leitung",
  assistant: "Assistenz",
  backup: "Stellvertretung",
};

type CourseDrawerProps = {
  /** The course of `?kurs=`; `null` keeps the drawer closed. */
  course: CourseDetail | null;
  candidates: Candidate[];
  /** The list URL without `kurs`; closing navigates there. */
  closeHref: string;
};

/**
 * Handoff §5 «Kurs-Drawer»: assigned instructors with their checks, the ranked candidates and
 * the course days, 560px at the right edge. Every write refreshes the server page.
 */
export function CourseDrawer({ course, candidates, closeHref }: CourseDrawerProps) {
  const router = useRouter();
  return (
    <Sheet
      open={course !== null}
      onOpenChange={(open) => {
        if (!open) router.replace(closeHref, { scroll: false });
      }}
    >
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-[560px]">
        {course ? <DrawerBody course={course} candidates={candidates} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ course, candidates }: { course: CourseDetail; candidates: Candidate[] }) {
  const canAssign = course.status !== "cancelled" && course.status !== "done";
  const meta = [
    course.location.name,
    course.isoWeek === null ? null : `KW ${course.isoWeek}`,
    formatDayRange(course.startsOn, course.endsOn),
    LANGUAGE_LABELS[course.language],
    `${course.booked}/${course.capacity} Teilnehmende`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <SheetHeader className="border-b border-border">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{course.courseType.code}</span>
          <StatusDot tone={courseTone(course)} label={COURSE_STATUS_LABELS[course.status]} className="text-xs" />
          {course.cohort ? <span className="text-xs text-muted-foreground">{course.cohort.label}</span> : null}
        </div>
        <SheetTitle className="text-lg">{course.courseType.name}</SheetTitle>
        <SheetDescription>{meta}</SheetDescription>
        {course.planningIssue ? (
          <div className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">{course.planningIssue}</div>
        ) : null}
      </SheetHeader>

      <div className="flex flex-col gap-6 p-4">
        <Section title="Zugewiesene Ausbilder" count={course.assignments.length}>
          {course.assignments.length === 0 ? (
            <p className="text-[13px] text-warn">Noch kein Ausbilder zugewiesen.</p>
          ) : (
            course.assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} />)
          )}
        </Section>

        <Section title="Kandidaten" count={candidates.filter((c) => c.result.ok).length}>
          <CandidateList courseId={course.id} candidates={candidates} canAssign={canAssign} />
        </Section>

        <Section title="Kurstage" count={course.days.length}>
          {course.days.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Keine Kurstage erfasst.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-[13px]">
              {course.days.map((day) => (
                <li key={day.id} className="flex items-baseline gap-3">
                  <span className="w-32 font-mono text-xs tabular-nums">
                    {format(parseISO(day.heldOn), "EEEEEE d.M.yyyy", { locale: de })}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {day.startsAt.slice(0, 5)}–{day.endsAt.slice(0, 5)}
                  </span>
                  <span className="text-muted-foreground">{day.room ? day.room.name : "Raum offen"}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {course.notes ? (
          <Section title="Notizen">
            <p className="text-[13px] whitespace-pre-wrap">{course.notes}</p>
          </Section>
        ) : null}
      </div>
    </>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {title}
        {count !== undefined ? <span className="font-mono tabular-nums">{count}</span> : null}
      </h3>
      {children}
    </section>
  );
}

function verdictOf(assignment: CourseAssignment): { tone: StatusTone; label: string } {
  if (!assignment.checkResult) return { tone: "muted", label: "nicht geprüft (Import)" };
  return assignment.checkResult.ok ? { tone: "ok", label: "machbar" } : { tone: "bad", label: "Konflikt" };
}

function AssignmentCard({ assignment }: { assignment: CourseAssignment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { instructor } = assignment;
  const name = `${instructor.firstName} ${instructor.lastName}`;
  const verdict = verdictOf(assignment);

  async function confirm() {
    setBusy(true);
    try {
      await confirmAssignment(assignment.id);
      toast.success(`Zuweisung von ${name} bestätigt`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bestätigen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await removeAssignment(assignment.id);
    toast.success(`Zuweisung von ${name} aufgehoben`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <InitialsAvatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">
              {EMPLOYMENT_TYPE_LABELS[instructor.employmentType]} · {instructor.homeLocation.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span>{ROLE_LABELS[assignment.role]}</span>
            <StatusDot
              tone={assignment.status === "confirmed" ? "ok" : "accent"}
              label={assignment.status === "confirmed" ? "bestätigt" : "vorgeschlagen"}
            />
            <StatusDot tone={verdict.tone} label={verdict.label} />
          </div>
        </div>
        {assignment.score !== null ? (
          <span className="font-mono text-sm tabular-nums" title="Score 0–100">
            {assignment.score}
          </span>
        ) : null}
      </div>
      {assignment.checkResult ? (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">Prüfung im Detail</summary>
          <CheckList result={assignment.checkResult} soft className="mt-2" />
        </details>
      ) : null}
      <div className="flex gap-2">
        {assignment.status === "proposed" ? (
          <Button type="button" size="sm" disabled={busy} onClick={confirm}>
            Bestätigen
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirmRemove(true)}>
          Zuweisung aufheben
        </Button>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Zuweisung aufheben"
        description={`${name} wird von diesem Kurs entfernt. Der Kurs ist danach ohne Ausbilder.`}
        confirmLabel="Aufheben"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}
