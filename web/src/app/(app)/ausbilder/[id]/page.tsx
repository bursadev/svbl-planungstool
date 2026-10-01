import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { AvailabilitiesPanel } from "@/components/ausbilder/availabilities-panel";
import { CertificatesPanel } from "@/components/ausbilder/certificates-panel";
import { ContactCard } from "@/components/ausbilder/contact-card";
import { InstructorActions } from "@/components/ausbilder/instructor-actions";
import { KnowledgeCard } from "@/components/ausbilder/knowledge-card";
import { EMPLOYMENT_TYPE_LABELS, INSTRUCTOR_STATUS_LABELS } from "@/lib/labels";
import { LanguageBadges } from "@/components/ausbilder/language-badges";
import { toLocationOptions } from "@/components/ausbilder/options";
import { SkillsPanel } from "@/components/ausbilder/skills-panel";
import { ActiveBadge, MetaItem, MetaList, UrlTabs } from "@/components/data";
import { InitialsAvatar } from "@/components/data/initials-avatar";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listCertificateTypes } from "@/lib/api/certificate-types";
import { getInstructor } from "@/lib/api/instructors";
import { listLocations } from "@/lib/api/locations";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { listSkills } from "@/lib/api/skills";

type AusbilderDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadInstructor = cache((id: string) => getInstructor(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: AusbilderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const instructor = await loadInstructor(id);
    return { title: `${instructor.firstName} ${instructor.lastName}` };
  } catch {
    return { title: "Ausbilder" };
  }
}

export default async function AusbilderDetailPage({ params }: AusbilderDetailPageProps) {
  const { id } = await params;
  const [instructor, locations, skills, certificateTypes] = await Promise.all([
    loadInstructor(id).catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    }),
    listLocations(undefined, serverApiFetch),
    // The pickers degrade to empty lists when a catalogue endpoint is unavailable.
    listSkills(serverApiFetch).catch(() => []),
    listCertificateTypes(serverApiFetch).catch(() => []),
  ]);
  if (!instructor) notFound();

  const name = `${instructor.firstName} ${instructor.lastName}`;
  const locationOptions = toLocationOptions(locations);
  const expiringOrExpired = instructor.certificates.filter((certificate) => certificate.status !== "valid").length;
  const openRequests = instructor.availabilities.filter((availability) => availability.status === "requested").length;

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/ausbilder"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Ausbilder
        </Link>
        <PageHeader title={name} actions={<InstructorActions instructor={instructor} locations={locationOptions} />} />
      </div>

      <Card size="sm">
        <CardContent className="flex items-start gap-4">
          <InitialsAvatar name={name} size="md" />
          <MetaList className="min-w-0 flex-1">
            <MetaItem label="Anstellung">{EMPLOYMENT_TYPE_LABELS[instructor.employmentType]}</MetaItem>
            <MetaItem label="Heimstandort">
              <Link href={`/standorte/${instructor.homeLocation.id}`} className="hover:underline">
                {instructor.homeLocation.name}
              </Link>
            </MetaItem>
            <MetaItem label="Sprachen">
              <LanguageBadges languages={instructor.languages} />
            </MetaItem>
            <MetaItem label="Wochenstunden">
              {instructor.weeklyHours !== null ? (
                <span className="font-mono tabular-nums">{instructor.weeklyHours}</span>
              ) : (
                <span className="text-muted-foreground">–</span>
              )}
            </MetaItem>
            {instructor.externalRef ? (
              <MetaItem label="Externe Referenz">
                <span className="font-mono">{instructor.externalRef}</span>
              </MetaItem>
            ) : null}
            <MetaItem label="Status">
              <ActiveBadge
                active={instructor.status === "active"}
                activeLabel={INSTRUCTOR_STATUS_LABELS.active}
                inactiveLabel={INSTRUCTOR_STATUS_LABELS.inactive}
              />
            </MetaItem>
          </MetaList>
        </CardContent>
      </Card>

      <UrlTabs
        tabs={[
          {
            value: "skills",
            label: "Skills & Wissen",
            content: (
              <div className="flex flex-col gap-4">
                <SkillsPanel instructor={instructor} allSkills={skills} />
                <div className="grid gap-4 md:grid-cols-2">
                  <ContactCard instructor={instructor} locations={locationOptions} />
                  <KnowledgeCard instructor={instructor} />
                </div>
              </div>
            ),
          },
          {
            value: "zertifikate",
            label: (
              <>
                Zertifikate
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {instructor.certificates.length}
                </span>
                {expiringOrExpired > 0 ? (
                  <span
                    aria-label={`${expiringOrExpired} ablaufend oder abgelaufen`}
                    className="size-2 rounded-full bg-warn"
                  />
                ) : null}
              </>
            ),
            content: (
              <CertificatesPanel
                instructorId={instructor.id}
                certificates={instructor.certificates}
                types={certificateTypes}
              />
            ),
          },
          {
            value: "verfuegbarkeit",
            label: (
              <>
                Verfügbarkeit
                {openRequests > 0 ? (
                  <span className="font-mono text-xs text-warn tabular-nums" title={`${openRequests} offene Anträge`}>
                    {openRequests}
                  </span>
                ) : null}
              </>
            ),
            content: <AvailabilitiesPanel instructorId={instructor.id} availabilities={instructor.availabilities} />,
          },
        ]}
      />
    </>
  );
}
