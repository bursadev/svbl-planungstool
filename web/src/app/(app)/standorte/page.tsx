import type { Metadata } from "next";
import { SearchInput, UrlTabs } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { CreateLocationButton } from "@/components/standorte/create-location-button";
import { DistancesPanel } from "@/components/standorte/distances-panel";
import { LocationsTable } from "@/components/standorte/locations-table";
import { listLocationDistances, listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Standorte" };

type StandortePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

/** `/standorte`: the list (`?q=`) and the Reisezeiten matrix in URL tabs (`?tab=`). */
export default async function StandortePage({ searchParams }: StandortePageProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() || undefined;
  const [locations, allLocations, distances] = await Promise.all([
    listLocations(query, serverApiFetch),
    // The matrix always covers every training centre, independent of the search.
    query ? listLocations(undefined, serverApiFetch) : undefined,
    listLocationDistances(serverApiFetch),
  ]);
  const centres = (allLocations ?? locations)
    .filter((location) => location.kind === "training_centre" && location.active)
    .map(({ id, code, name }) => ({ id, code, name }));

  return (
    <>
      <PageHeader title="Standorte" actions={<CreateLocationButton />} />
      <UrlTabs
        tabs={[
          {
            value: "liste",
            label: "Standorte",
            content: (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <SearchInput placeholder="Name, Code oder Ort" className="w-72" />
                </div>
                <LocationsTable locations={locations} />
              </div>
            ),
          },
          {
            value: "reisezeiten",
            label: "Reisezeiten",
            content: <DistancesPanel locations={centres} distances={distances} />,
          },
        ]}
      />
    </>
  );
}
