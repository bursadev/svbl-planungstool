import type { Metadata } from "next";
import { addWeeks, format } from "date-fns";
import { Pagination, ResetFilters, SearchInput, UrlDateRange } from "@/components/data";
import { AutoStaffDialog } from "@/components/kurse/auto-staff-dialog";
import { CourseDrawer } from "@/components/kurse/course-drawer";
import { CoursesFilters } from "@/components/kurse/courses-filters";
import { CoursesTable } from "@/components/kurse/courses-table";
import { getCourse, listCandidates, listCoursesPage, type CourseFilters } from "@/lib/api/courses";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { dateParam, first, oneOf, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Kurse" };

const SORTABLE = ["startsOn", "location", "courseType", "status"] as const;
const STATUSES = ["demand", "planned", "open", "confirmed", "running", "done", "cancelled"] as const;

/** `?besetzung=` values and their API counterparts. */
const STAFFING_PARAMS = { offen: "unstaffed", besetzt: "staffed" } as const;

/**
 * Tab «Durchführungen»: the courses of a range (default: the next eight weeks) with their dates,
 * instructors and seats; filters, sorting and paging live in the URL. `?kurs=<id>` opens the
 * course drawer over the list.
 */
export default async function KursePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultTo = format(addWeeks(new Date(), 8), "yyyy-MM-dd");
  const staffing = oneOf(params.besetzung, Object.keys(STAFFING_PARAMS) as (keyof typeof STAFFING_PARAMS)[]);
  const filters: Omit<CourseFilters, "page" | "pageSize" | "sort" | "dir" | "archive"> = {
    from: dateParam(params.von) ?? today,
    to: dateParam(params.bis) ?? defaultTo,
    locationId: uuidParam(params.standort),
    kind: oneOf(params.art, ["uk", "adult", "exam"]),
    status: oneOf(params.status, STATUSES),
    language: oneOf(params.sprache, ["de", "fr", "it"]),
    staffing: staffing && STAFFING_PARAMS[staffing],
    q: first(params.q),
  };

  const selectedId = uuidParam(params.kurs);
  const [page, locations, course] = await Promise.all([
    listCoursesPage({ ...filters, page: list.page, pageSize: list.pageSize, sort: list.sort, dir: list.dir }, serverApiFetch),
    listLocations(undefined, serverApiFetch),
    // An unknown or malformed id simply leaves the drawer closed.
    selectedId ? getCourse(selectedId, serverApiFetch).catch(() => null) : Promise.resolve(null),
  ]);
  const candidates = course ? await listCandidates(course.id, { all: true, limit: 1000 }, serverApiFetch).catch(() => []) : [];
  const activeLocations = locations.filter((location) => location.active);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v !== undefined && key !== "kurs") query.set(key, v);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Kurs, Standort, OdAOrg-Nr." className="w-64" />
        <UrlDateRange fromParam="von" toParam="bis" defaultFrom={today} defaultTo={defaultTo} />
        <CoursesFilters locations={activeLocations} />
        <ResetFilters />
        <div className="ms-auto">
          <AutoStaffDialog
            defaultFrom={filters.from ?? today}
            defaultTo={filters.to ?? defaultTo}
            locations={activeLocations.map(({ id, name }) => ({ id, name }))}
          />
        </div>
      </div>
      <CoursesTable courses={page.items} query={query.toString()} />
      <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      <CourseDrawer course={course} candidates={candidates} closeHref={`/kurse?${query.toString()}`} />
    </div>
  );
}
