import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { CommitStage } from "@/components/planung/commit-stage";
import { CoursesStage } from "@/components/planung/courses-stage";
import { DemandStage } from "@/components/planung/demand-stage";
import { DiscardRunButton } from "@/components/planung/discard-run-button";
import { formatPeriod, reachedStage } from "@/components/planung/labels";
import { ReadinessList } from "@/components/planung/readiness-list";
import { StageBar } from "@/components/planung/stage-bar";
import { StaffingStage } from "@/components/planung/staffing-stage";
import { PageHeader } from "@/components/shell/page-header";
import {
  getCommitSummary,
  getPlanningRun,
  listDemand,
  listRunCourses,
  type CommitSummary,
  type DemandRow,
  type RunCourse,
} from "@/lib/api/planning-runs";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { first, type SearchParams } from "@/lib/list-params";

type PlanungslaufPageProps = { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> };

const loadRun = cache((id: string) => getPlanningRun(id, serverApiFetch));

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: PlanungslaufPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    return { title: (await loadRun(id)).label };
  } catch {
    return { title: "Planungslauf" };
  }
}

/**
 * `/planung/[id]`: one run with its four stages; `?stufe=1..4` picks the panel, default is the
 * furthest stage with data. The panels load only what they show.
 */
export default async function PlanungslaufPage({ params, searchParams }: PlanungslaufPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const run = await loadRun(id).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (!run) notFound();

  const reached = reachedStage(run);
  const requested = Number.parseInt(first(sp.stufe) ?? "", 10);
  const available = reached >= 0 ? 3 : 0;
  const active =
    Number.isInteger(requested) && requested >= 1 && requested - 1 <= available
      ? requested - 1
      : run.status === "committed"
        ? 3
        : Math.max(0, reached);
  const href = (stage: number) => `/planung/${id}?stufe=${stage}`;

  let demand: DemandRow[] = [];
  let courses: RunCourse[] = [];
  let summary: CommitSummary | null = null;
  if (active === 0 && reached >= 0) demand = await listDemand(id, serverApiFetch);
  if (active === 1 || active === 2) courses = await listRunCourses(id, serverApiFetch);
  if (active === 3) summary = await getCommitSummary(id, serverApiFetch);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/planung" className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Alle Planungsläufe
        </Link>
        <PageHeader title={run.label} actions={<DiscardRunButton run={run} afterDiscard="list" />} />
        <div className="text-[13px] text-muted-foreground">
          {formatPeriod(run.periodStartsOn, run.periodEndsOn)} · erstellt {formatDate(run.createdAt)}
          {run.createdBy ? ` von ${run.createdBy}` : ""}
          {run.committedAt ? ` · übernommen ${formatDate(run.committedAt)}` : ""}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <StageBar run={run} active={active} href={href} />
        <ReadinessList report={run.readiness} />
        {active === 0 ? (
          <DemandStage run={run} demand={demand} hasCourses={run.counts.coursesProposed + run.counts.coursesUnplannable > 0} nextHref={href(2)} />
        ) : null}
        {active === 1 ? <CoursesStage run={run} courses={courses} prevHref={href(1)} nextHref={href(3)} /> : null}
        {active === 2 ? <StaffingStage run={run} courses={courses} prevHref={href(2)} nextHref={href(4)} /> : null}
        {active === 3 && summary ? <CommitStage run={run} summary={summary} prevHref={href(3)} /> : null}
      </div>
    </>
  );
}
