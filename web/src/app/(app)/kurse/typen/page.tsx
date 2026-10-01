import type { Metadata } from "next";
import { CourseTypeCards } from "@/components/kurse/course-type-cards";
import { CourseTypeFilters } from "@/components/kurse/course-type-filters";
import { CreateCourseTypeButton } from "@/components/kurse/create-course-type-button";
import { parseActive, parseKind, parseTrackFilter } from "@/components/kurse/search-params";
import {
  listCertificateTypeOptions,
  listCourseTypes,
  listDeviceTypeOptions,
  listSkillOptions,
} from "@/lib/api/course-types";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Kurstypen" };

type KurstypenPageProps = {
  searchParams: Promise<{
    art?: string | string[];
    lehrgang?: string | string[];
    aktiv?: string | string[];
  }>;
};

/**
 * `/kurse/typen`: filters in the URL (`?art=`, `?lehrgang=`, `?aktiv=`), cards rendered on the
 * server. `GET /course-types` has no filters, so the list is narrowed here.
 */
export default async function KurstypenPage({ searchParams }: KurstypenPageProps) {
  const params = await searchParams;
  const kind = parseKind(params.art);
  const track = parseTrackFilter(params.lehrgang);
  const active = parseActive(params.aktiv);

  const [courseTypes, skills, certificateTypes, deviceTypes] = await Promise.all([
    listCourseTypes(serverApiFetch),
    // The pickers belong to the Kataloge slice; the dialog says so when one is unavailable.
    listSkillOptions(serverApiFetch).catch(() => null),
    listCertificateTypeOptions(serverApiFetch).catch(() => null),
    listDeviceTypeOptions(serverApiFetch).catch(() => null),
  ]);

  const visible = courseTypes.filter(
    (courseType) =>
      (kind === undefined || courseType.kind === kind) &&
      (track === undefined || (track === "none" ? courseType.track === null : courseType.track === track)) &&
      (active === undefined || courseType.active === active),
  );
  const filtered = kind !== undefined || track !== undefined || active !== undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <CourseTypeFilters />
        <p className="text-sm text-muted-foreground tabular-nums">
          {filtered ? `${visible.length} von ${courseTypes.length}` : courseTypes.length}{" "}
          {courseTypes.length === 1 ? "Kurstyp" : "Kurstypen"}
        </p>
        <div className="ms-auto">
          <CreateCourseTypeButton />
        </div>
      </div>
      <CourseTypeCards
        courseTypes={visible}
        options={{ skills, certificateTypes, deviceTypes }}
        emptyText={courseTypes.length === 0 ? "Noch keine Kurstypen erfasst." : "Keine Kurstypen für diese Filter."}
      />
    </>
  );
}
