import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { MetaItem, MetaList, UrlTabs } from "@/components/data";
import { CompanyActions } from "@/components/lehrbetriebe/company-actions";
import { TrainersPanel } from "@/components/lehrbetriebe/trainers-panel";
import { ApprenticesTable } from "@/components/lernende/apprentices-table";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listApprentices } from "@/lib/api/apprentices";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { getTrainingCompany } from "@/lib/api/training-companies";
import { formatAddress } from "@/lib/format";

type LehrbetriebDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadCompany = cache((id: string) => getTrainingCompany(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: LehrbetriebDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const company = await loadCompany(id);
    return { title: company.name };
  } catch {
    return { title: "Lehrbetrieb" };
  }
}

export default async function LehrbetriebDetailPage({ params }: LehrbetriebDetailPageProps) {
  const { id } = await params;
  const company = await loadCompany(id).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (!company) notFound();
  const apprentices = await listApprentices({ trainingCompanyId: company.id }, serverApiFetch);

  const address = formatAddress(company);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/lernende/lehrbetriebe"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Lehrbetriebe
        </Link>
        <PageHeader title={company.name} actions={<CompanyActions company={company} />} />
      </div>

      <Card size="sm">
        <CardContent>
          <MetaList>
            <MetaItem label="Adresse">
              {address || <span className="text-muted-foreground">–</span>}
            </MetaItem>
            <MetaItem label="E-Mail">
              {company.email ?? <span className="text-muted-foreground">–</span>}
            </MetaItem>
            <MetaItem label="Telefon">
              {company.phone ?? <span className="text-muted-foreground">–</span>}
            </MetaItem>
            {company.externalRef ? (
              <MetaItem label="Externe Referenz">
                <span className="font-mono">{company.externalRef}</span>
              </MetaItem>
            ) : null}
          </MetaList>
        </CardContent>
      </Card>

      <UrlTabs
        tabs={[
          {
            value: "berufsbildner",
            label: (
              <>
                Berufsbildner
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{company.trainerCount}</span>
              </>
            ),
            content: <TrainersPanel companyId={company.id} trainers={company.trainers} />,
          },
          {
            value: "lernende",
            label: (
              <>
                Lernende
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{apprentices.length}</span>
              </>
            ),
            content: <ApprenticesTable apprentices={apprentices} />,
          },
        ]}
      />
    </>
  );
}
