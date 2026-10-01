import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { StatusDot } from "@/components/data/status-dot";
import { UrlTabs } from "@/components/data/url-tabs";
import { ApprenticeStammdaten } from "@/components/lernende/apprentice-stammdaten";
import { APPRENTICE_STATUS_LABELS } from "@/lib/labels";
import { APPRENTICE_STATUS_TONES } from "@/components/lernende/labels";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";
import { Badge } from "@/components/ui/badge";
import { getApprentice } from "@/lib/api/apprentices";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { TRACK_LABELS } from "@/lib/format";

type LernendePageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadApprentice = cache((id: string) => getApprentice(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: LernendePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const apprentice = await loadApprentice(id);
    return { title: `${apprentice.firstName} ${apprentice.lastName}` };
  } catch {
    return { title: "Lernende/r" };
  }
}

/** `/lernende/[id]`: read-only detail; the school export is the source, so there are no actions. */
export default async function LernendeDetailPage({ params }: LernendePageProps) {
  const { id } = await params;
  const apprentice = await loadApprentice(id).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (!apprentice) notFound();

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/lernende"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Lernende
        </Link>
        <PageHeader title={`${apprentice.firstName} ${apprentice.lastName}`} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{TRACK_LABELS[apprentice.track]}</Badge>
          <span>{apprentice.cohort.label}</span>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <StatusDot tone={APPRENTICE_STATUS_TONES[apprentice.status]} label={APPRENTICE_STATUS_LABELS[apprentice.status]} />
        </div>
      </div>

      <UrlTabs
        tabs={[
          {
            value: "stammdaten",
            label: "Stammdaten",
            content: <ApprenticeStammdaten apprentice={apprentice} />,
          },
          {
            value: "bildungsplan",
            label: "Bildungsplan",
            content: <PlaceholderCard>Kommt mit dem Import.</PlaceholderCard>,
          },
          {
            value: "kursteilnahmen",
            label: "Kursteilnahmen",
            content: <PlaceholderCard>Kommt mit dem Zeitplan.</PlaceholderCard>,
          },
        ]}
      />
    </>
  );
}
