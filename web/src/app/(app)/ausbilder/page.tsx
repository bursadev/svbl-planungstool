import type { Metadata } from "next";
import { CreateInstructorButton } from "@/components/ausbilder/create-instructor-button";
import { FiltersBar } from "@/components/ausbilder/filters-bar";
import { InstructorsTable } from "@/components/ausbilder/instructors-table";
import { toLocationOptions } from "@/components/ausbilder/options";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { listCertificateTypes } from "@/lib/api/certificate-types";
import { INSTRUCTORS_PATH, instructorQuery, listInstructorsPage, type InstructorFilters } from "@/lib/api/instructors";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { listSkills } from "@/lib/api/skills";
import { first, hasFilters, oneOf, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Ausbilder" };

const SORTABLE = ["name", "location", "employmentType"] as const;

/** `?zertifikatsstatus=` values and their API counterparts. */
const CERTIFICATE_STATUS_PARAMS = {
  gueltig: "valid",
  laeuft_ab: "expiring",
  abgelaufen: "expired",
} as const;

type CertificateStatusParam = keyof typeof CERTIFICATE_STATUS_PARAMS;

/**
 * `/ausbilder`: the list with its filters, sorting and paging in the URL, rendered on the server
 * with the signed-in user's token. Filters: `q`, `skill`, `sprache`, `standort`, `anstellung`,
 * `zertifikat`, `zertifikatsstatus`, `archiv` (archived = inactive).
 */
export default async function AusbilderPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const certificateStatus = oneOf(
    params.zertifikatsstatus,
    Object.keys(CERTIFICATE_STATUS_PARAMS) as CertificateStatusParam[],
  );
  const filters: Omit<InstructorFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    skillId: uuidParam(params.skill),
    language: oneOf(params.sprache, ["de", "fr", "it"]),
    locationId: uuidParam(params.standort),
    employmentType: oneOf(params.anstellung, ["employee", "freelancer"]),
    certificateTypeId: uuidParam(params.zertifikat),
    certificateStatus: certificateStatus && CERTIFICATE_STATUS_PARAMS[certificateStatus],
    archive: list.archive,
  };

  const [page, skills, locations, certificateTypes] = await Promise.all([
    listInstructorsPage({ ...filters, ...list }, serverApiFetch),
    // The skill and certificate filters degrade to «Alle» when their catalogue is unavailable.
    listSkills(serverApiFetch).catch(() => []),
    listLocations(undefined, serverApiFetch),
    listCertificateTypes(serverApiFetch).catch(() => []),
  ]);
  const locationOptions = toLocationOptions(locations);
  const certificateTypeOptions = certificateTypes
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "de-CH"));

  return (
    <>
      <PageHeader
        title="Ausbilder"
        actions={
          <>
            <CsvMenu
              basePath={INSTRUCTORS_PATH}
              plural="Ausbilder"
              filters={instructorQuery(filters)}
              filtered={hasFilters(params)}
            />
            <CreateInstructorButton locations={locationOptions} />
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, E-Mail, Telefon, Standort" className="w-72" />
          <FiltersBar
            skills={skills.filter((skill) => skill.active)}
            locations={locationOptions}
            certificateTypes={certificateTypeOptions}
          />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <InstructorsTable instructors={page.items} />
        <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      </div>
    </>
  );
}
