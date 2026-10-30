import type { Metadata } from "next";
import { UrlTabs } from "@/components/data/url-tabs";
import { CertificateTypesPanel } from "@/components/kataloge/certificate-types-panel";
import { DeviceTypesPanel } from "@/components/kataloge/device-types-panel";
import { SkillsPanel } from "@/components/kataloge/skills-panel";
import { PageHeader } from "@/components/shell/page-header";
import { listCertificateTypes, listCertificateTypesPage } from "@/lib/api/certificate-types";
import { listCourseTypes } from "@/lib/api/course-types";
import { listDeviceTypesPage } from "@/lib/api/device-types";
import { serverApiFetch } from "@/lib/api/server";
import { listSkills, listSkillsPage } from "@/lib/api/skills";
import { archiveScope, first, hasFilters, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Kataloge" };

function Count({ value }: { value: number }) {
  return <span className="font-mono text-xs text-muted-foreground tabular-nums">{value}</span>;
}

/**
 * `/kataloge`: Skills, Zertifikatstypen and Gerätetypen in URL tabs (`?tab=`), all loaded on the
 * server. The tabs share their filters (`q`, `archiv`): a search filters every tab, and the tab
 * counts show the hits. The lists are small, so they are not paged.
 */
export default async function KatalogePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = { q: first(params.q), archive: archiveScope(params) };
  const filtered = hasFilters(params);

  const [skills, certificateTypes, deviceTypes, allSkills, allCertificateTypes, courseTypes] = await Promise.all([
    listSkillsPage(filters, serverApiFetch),
    listCertificateTypesPage(filters, serverApiFetch),
    listDeviceTypesPage(filters, serverApiFetch),
    // The Gerätetyp dialog picks from every entry, independent of the filters.
    listSkills(serverApiFetch),
    listCertificateTypes(serverApiFetch),
    // The Pflichtkurse picker degrades to a message when Kurstypen are unavailable.
    listCourseTypes(serverApiFetch)
      .then((types) => types.map(({ id, code, name }) => ({ id, code, name })))
      .catch(() => null),
  ]);

  return (
    <>
      <PageHeader title="Kataloge" />
      <UrlTabs
        tabs={[
          {
            value: "skills",
            label: (
              <>
                Skills
                <Count value={skills.total} />
              </>
            ),
            content: <SkillsPanel skills={skills.items} filters={filters} filtered={filtered} />,
          },
          {
            value: "zertifikatstypen",
            label: (
              <>
                Zertifikatstypen
                <Count value={certificateTypes.total} />
              </>
            ),
            content: (
              <CertificateTypesPanel
                types={certificateTypes.items}
                courseTypes={courseTypes}
                filters={filters}
                filtered={filtered}
              />
            ),
          },
          {
            value: "geraetetypen",
            label: (
              <>
                Gerätetypen
                <Count value={deviceTypes.total} />
              </>
            ),
            content: (
              <DeviceTypesPanel
                types={deviceTypes.items}
                certificateTypes={allCertificateTypes}
                skills={allSkills}
                filters={filters}
                filtered={filtered}
              />
            ),
          },
        ]}
      />
    </>
  );
}
