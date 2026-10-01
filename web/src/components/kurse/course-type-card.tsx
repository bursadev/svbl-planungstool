import type { ReactNode } from "react";
import { ActiveBadge, StatusDot } from "@/components/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseType } from "@/lib/api/course-types";
import { cn } from "@/lib/utils";
import { KindBadge, TrackBadge } from "./course-badges";
import { formatDuration, formatLanguages, formatModuleSlot, formatParticipants } from "./labels";

type CourseTypeCardProps = {
  courseType: CourseType;
  onEdit: () => void;
  onRequirements: () => void;
  onDelete: () => void;
};

/** One Kurstyp in the `/kurse/typen` grid: head with badges, fact rows, actions in the footer. */
export function CourseTypeCard({ courseType, onEdit, onRequirements, onDelete }: CourseTypeCardProps) {
  return (
    <Card size="sm" className={cn("gap-3", !courseType.active && "opacity-70")}>
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="me-1 font-mono text-xs text-muted-foreground">{courseType.code}</span>
          <KindBadge kind={courseType.kind} />
          {courseType.track ? <TrackBadge track={courseType.track} /> : null}
          {!courseType.active ? <ActiveBadge active={false} /> : null}
        </div>
        <CardTitle>{courseType.name}</CardTitle>
        {courseType.description ? (
          <CardDescription className="line-clamp-2 text-[13px]">{courseType.description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
          <Fact label="Dauer">{formatDuration(courseType)}</Fact>
          <Fact label="Teilnehmer">
            <span className="font-mono tabular-nums">
              {formatParticipants(courseType.minParticipants, courseType.maxParticipants)}
            </span>
          </Fact>
          <Fact label="Sprachen">{formatLanguages(courseType.languages)}</Fact>
          <Fact label="Skills">
            {courseType.requiredSkills.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {courseType.requiredSkills.map((skill) => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
              </span>
            ) : (
              <None />
            )}
          </Fact>
          <Fact label="Zertifikate">
            {courseType.requiredCertificates.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {courseType.requiredCertificates.map((certificate) => (
                  <Badge key={certificate.id} variant="outline" className="font-mono" title={certificate.name}>
                    {certificate.code}
                  </Badge>
                ))}
              </span>
            ) : (
              <None />
            )}
          </Fact>
          <Fact label="Geräte">
            {courseType.requiredDevices.length > 0 ? (
              <span className="flex flex-col gap-0.5">
                {courseType.requiredDevices.map((device) => (
                  <span key={device.deviceType.id}>
                    <span className="font-mono tabular-nums">{device.quantity} ×</span> {device.deviceType.name}
                  </span>
                ))}
              </span>
            ) : (
              <None />
            )}
          </Fact>
          <Fact label="Semester">
            {courseType.curriculumModule ? formatModuleSlot(courseType.curriculumModule) : <None />}
          </Fact>
          <Fact label="Veröffentlicht">
            <StatusDot tone={courseType.published ? "ok" : "muted"} label={courseType.published ? "Ja" : "Nein"} />
          </Fact>
        </dl>
      </CardContent>

      <CardFooter className="gap-1 px-2 py-1.5">
        <Button variant="ghost" size="xs" onClick={onEdit}>
          Bearbeiten
        </Button>
        <Button variant="ghost" size="xs" onClick={onRequirements}>
          Anforderungen
        </Button>
        <Button variant="ghost" size="xs" className="ms-auto text-destructive hover:text-destructive" onClick={onDelete}>
          Löschen
        </Button>
      </CardFooter>
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function None() {
  return <span className="text-muted-foreground">–</span>;
}
