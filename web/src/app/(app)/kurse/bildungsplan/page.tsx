import type { Metadata } from "next";
import { CohortsSection } from "@/components/kurse/cohorts-section";
import { ModulesSection } from "@/components/kurse/modules-section";
import { firstParam, parseTrack } from "@/components/kurse/search-params";
import { TimeWindowsSection } from "@/components/kurse/time-windows-section";
import { TrackSwitch } from "@/components/kurse/track-switch";
import { listCourseTypes } from "@/lib/api/course-types";
import { listCohorts, listCurriculumModules, listTimeWindows } from "@/lib/api/curriculum";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { TRACK_LABELS } from "@/lib/format";

export const metadata: Metadata = { title: "Bildungsplan" };

type BildungsplanPageProps = {
  searchParams: Promise<{
    lehrgang?: string | string[];
    jahrgang?: string | string[];
  }>;
};

/**
 * `/kurse/bildungsplan`: `?lehrgang=efz|eba` (default EFZ) selects the modules and cohorts,
 * `?jahrgang=<id>` the cohort whose time windows are shown (default: the newest of the track).
 */
export default async function BildungsplanPage({ searchParams }: BildungsplanPageProps) {
  const params = await searchParams;
  const track = parseTrack(params.lehrgang) ?? "efz";
  const requestedCohortId = firstParam(params.jahrgang);

  const [modules, cohorts, courseTypes, locations, requestedWindows] = await Promise.all([
    listCurriculumModules(track, serverApiFetch),
    listCohorts(serverApiFetch),
    // The module dialog offers the free ÜK types of the track; the time-window dialog the Standorte.
    listCourseTypes(serverApiFetch),
    listLocations(undefined, serverApiFetch),
    // With a cohort in the URL its windows load alongside; a stale or malformed id falls back below.
    requestedCohortId ? listTimeWindows(requestedCohortId, serverApiFetch).catch(() => null) : null,
  ]);

  const trackCohorts = cohorts.filter((cohort) => cohort.track === track);
  const cohort = trackCohorts.find((candidate) => candidate.id === requestedCohortId) ?? trackCohorts[0] ?? null;
  const timeWindows =
    cohort === null
      ? []
      : requestedWindows && cohort.id === requestedCohortId
        ? requestedWindows
        : await listTimeWindows(cohort.id, serverApiFetch);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <TrackSwitch track={track} />
        <p className="text-sm text-muted-foreground">
          Bildungsplan {TRACK_LABELS[track]}: ÜK-Module, Jahrgänge und ihre Zeitfenster.
        </p>
      </div>
      <ModulesSection track={track} modules={modules} courseTypes={courseTypes} />
      <CohortsSection cohorts={cohorts} track={track} />
      <TimeWindowsSection
        track={track}
        cohorts={trackCohorts}
        cohort={cohort}
        modules={modules}
        locations={locations}
        timeWindows={timeWindows}
      />
    </>
  );
}
