import type { Metadata } from "next";
import { SearchInput } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { CreateLocationButton } from "@/components/standorte/create-location-button";
import { LocationsTable } from "@/components/standorte/locations-table";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Standorte" };

type StandortePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

/** `/standorte`: search in the URL (`?q=`), list rendered on the server with the signed-in user's token. */
export default async function StandortePage({ searchParams }: StandortePageProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() || undefined;
  const locations = await listLocations(query, serverApiFetch);

  return (
    <>
      <PageHeader title="Standorte" actions={<CreateLocationButton />} />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Name, Code oder Ort" className="w-72" />
      </div>
      <LocationsTable locations={locations} />
    </>
  );
}
