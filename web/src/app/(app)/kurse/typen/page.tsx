import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { CourseTypeFilters } from "@/components/kurse/course-type-filters";
import { CourseTypesTable } from "@/components/kurse/course-types-table";
import { CreateCourseTypeButton } from "@/components/kurse/create-course-type-button";
import { parseKind, parseTrackFilter } from "@/components/kurse/search-params";
import { listCertificateTypes } from "@/lib/api/certificate-types";
import {
  COURSE_TYPES_PATH,
  courseTypeQuery,
  listCourseTypesPage,
  type CourseTypeFilters as Filters,
} from "@/lib/api/course-types";
import { listDeviceTypes } from "@/lib/api/device-types";
import { serverApiFetch } from "@/lib/api/server";
import { listSkills } from "@/lib/api/skills";
import { first, hasFilters, oneOf, readListParams, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Kurstypen" };

const SORTABLE = ["code", "name", "duration"] as const;

/**
 * `/kurse/typen`: the Kurstypen as a paged table, filtered on the server. Filters in the URL:
 * `q`, `art`, `lehrgang` (`efz`, `eba`, `keiner`), `sprache`, `archiv`; plus paging and sorting.
 */
export default async function KurstypenPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const filters: Omit<Filters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    kind: parseKind(params.art),
    track: parseTrackFilter(params.lehrgang),
    language: oneOf(params.sprache, ["de", "fr", "it"]),
    archive: list.archive,
  };
  const filtered = hasFilters(params);

  const [page, skills, certificateTypes, deviceTypes] = await Promise.all([
    listCourseTypesPage({ ...filters, ...list }, serverApiFetch),
    // The pickers belong to the Kataloge slice; the dialog says so when one is unavailable.
    listSkills(serverApiFetch).catch(() => null),
    listCertificateTypes(serverApiFetch).catch(() => null),
    listDeviceTypes(serverApiFetch).catch(() => null),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Code, Name, Beschreibung" className="w-72" />
        <CourseTypeFilters />
        <ArchiveFilter />
        <ResetFilters />
        <div className="ms-auto flex items-center gap-2">
          <CsvMenu
            basePath={COURSE_TYPES_PATH}
            plural="Kurstypen"
            filters={courseTypeQuery(filters)}
            filtered={filtered}
          />
          <CreateCourseTypeButton />
        </div>
      </div>
      <CourseTypesTable
        courseTypes={page.items}
        options={{ skills, certificateTypes, deviceTypes }}
        emptyText={filtered ? "Keine Kurstypen für diese Filter." : "Noch keine Kurstypen erfasst."}
      />
      <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
    </>
  );
}
