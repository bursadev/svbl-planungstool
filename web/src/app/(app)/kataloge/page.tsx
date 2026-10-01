import type { Metadata } from "next";
import { UrlTabs } from "@/components/data/url-tabs";
import { CertificateTypesPanel } from "@/components/kataloge/certificate-types-panel";
import { DeviceTypesPanel } from "@/components/kataloge/device-types-panel";
import { SkillsPanel } from "@/components/kataloge/skills-panel";
import { PageHeader } from "@/components/shell/page-header";
import { listCertificateTypes, listCourseTypeRefs } from "@/lib/api/certificate-types";
import { listDeviceTypes } from "@/lib/api/device-types";
import { serverApiFetch } from "@/lib/api/server";
import { listSkills } from "@/lib/api/skills";

export const metadata: Metadata = { title: "Kataloge" };

function Count({ value }: { value: number }) {
  return <span className="font-mono text-xs text-muted-foreground tabular-nums">{value}</span>;
}

/** `/kataloge`: Skills, Zertifikatstypen and Gerätetypen in URL tabs (`?tab=`), all loaded on the server. */
export default async function KatalogePage() {
  const [skills, certificateTypes, deviceTypes, courseTypes] = await Promise.all([
    listSkills(serverApiFetch),
    listCertificateTypes(serverApiFetch),
    listDeviceTypes(serverApiFetch),
    // The Pflichtkurse picker degrades to a message when Kurstypen are unavailable.
    listCourseTypeRefs(serverApiFetch)
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
                <Count value={skills.length} />
              </>
            ),
            content: <SkillsPanel skills={skills} />,
          },
          {
            value: "zertifikatstypen",
            label: (
              <>
                Zertifikatstypen
                <Count value={certificateTypes.length} />
              </>
            ),
            content: <CertificateTypesPanel types={certificateTypes} courseTypes={courseTypes} />,
          },
          {
            value: "geraetetypen",
            label: (
              <>
                Gerätetypen
                <Count value={deviceTypes.length} />
              </>
            ),
            content: <DeviceTypesPanel types={deviceTypes} certificateTypes={certificateTypes} skills={skills} />,
          },
        ]}
      />
    </>
  );
}
