import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ActiveBadge, MetaItem, MetaList, UrlTabs } from "@/components/data";
import { CustomerActions } from "@/components/kunden/customer-actions";
import { CustomerSitesTable } from "@/components/kunden/customer-sites-table";
import { ParticipantsPanel } from "@/components/kunden/participants-panel";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomer } from "@/lib/api/customers";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { formatAddress } from "@/lib/format";

type KundeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadCustomer = cache((id: string) => getCustomer(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: KundeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const customer = await loadCustomer(id);
    return { title: customer.name };
  } catch {
    return { title: "Kunde" };
  }
}

export default async function KundeDetailPage({ params }: KundeDetailPageProps) {
  const { id } = await params;
  const customer = await loadCustomer(id).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (!customer) notFound();

  const address = formatAddress(customer);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/kunden"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Kunden
        </Link>
        <PageHeader title={customer.name} actions={<CustomerActions customer={customer} />} />
      </div>

      <Card size="sm">
        <CardContent>
          <MetaList>
            <MetaItem label="Adresse">{address || <span className="text-muted-foreground">–</span>}</MetaItem>
            <MetaItem label="Kontakt">
              {customer.contactName || customer.contactEmail ? (
                <>
                  {customer.contactName}
                  {customer.contactName && customer.contactEmail ? " · " : null}
                  {customer.contactEmail}
                </>
              ) : (
                <span className="text-muted-foreground">–</span>
              )}
            </MetaItem>
            {customer.externalRefAbacus ? (
              <MetaItem label="Abacus">
                <span className="font-mono">{customer.externalRefAbacus}</span>
              </MetaItem>
            ) : null}
            {customer.externalRefOdaorg ? (
              <MetaItem label="OdAOrg">
                <span className="font-mono">{customer.externalRefOdaorg}</span>
              </MetaItem>
            ) : null}
            <MetaItem label="Status">
              <ActiveBadge active={customer.active} />
            </MetaItem>
          </MetaList>
        </CardContent>
      </Card>

      <UrlTabs
        tabs={[
          {
            value: "teilnehmende",
            label: (
              <>
                Teilnehmende
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {customer.participantCount}
                </span>
              </>
            ),
            content: (
              <ParticipantsPanel
                participants={customer.participants}
                customers={[{ id: customer.id, name: customer.name }]}
                lockedCustomerId={customer.id}
              />
            ),
          },
          {
            value: "standorte",
            label: (
              <>
                Standorte
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{customer.siteCount}</span>
              </>
            ),
            content: <CustomerSitesTable sites={customer.sites} />,
          },
        ]}
      />
    </>
  );
}
