import type { Metadata } from "next";
import { CreateInstructorButton } from "@/components/ausbilder/create-instructor-button";
import { FiltersBar } from "@/components/ausbilder/filters-bar";
import { InstructorsTable } from "@/components/ausbilder/instructors-table";
import { toLocationOptions } from "@/components/ausbilder/options";
import { PageHeader } from "@/components/shell/page-header";
import { listInstructors, type InstructorFilters } from "@/lib/api/instructors";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { listSkills } from "@/lib/api/skills";

export const metadata: Metadata = { title: "Ausbilder" };

type SearchParam = string | string[] | undefined;

type AusbilderPageProps = {
  searchParams: Promise<{
    q?: SearchParam;
    skill?: SearchParam;
    sprache?: SearchParam;
    standort?: SearchParam;
    anstellung?: SearchParam;
    status?: SearchParam;
  }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: SearchParam): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** Keeps only values the API accepts; anything else is treated as «Alle» rather than a 400. */
function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function uuid(value: string | undefined): string | undefined {
  return value && UUID.test(value) ? value : undefined;
}

/** `/ausbilder`: filters in the URL, list rendered on the server with the signed-in user's token. */
export default async function AusbilderPage({ searchParams }: AusbilderPageProps) {
  const params = await searchParams;
  const filters: InstructorFilters = {
    q: first(params.q),
    skillId: uuid(first(params.skill)),
    language: oneOf(first(params.sprache), ["de", "fr", "it"]),
    locationId: uuid(first(params.standort)),
    employmentType: oneOf(first(params.anstellung), ["employee", "freelancer"]),
    status: oneOf(first(params.status), ["active", "inactive"]),
  };

  const [instructors, skills, locations] = await Promise.all([
    listInstructors(filters, serverApiFetch),
    // The skill filter degrades to «Alle Skills» when the catalogue endpoint is unavailable.
    listSkills(serverApiFetch).catch(() => []),
    listLocations(undefined, serverApiFetch),
  ]);
  const locationOptions = toLocationOptions(locations);

  return (
    <>
      <PageHeader title="Ausbilder" actions={<CreateInstructorButton locations={locationOptions} />} />
      <FiltersBar skills={skills.filter((skill) => skill.active)} locations={locationOptions} />
      <InstructorsTable instructors={instructors} />
    </>
  );
}
