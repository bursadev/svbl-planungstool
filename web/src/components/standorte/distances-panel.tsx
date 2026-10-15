"use client";

import { useState } from "react";
import type { Location, LocationDistance } from "@/lib/api/locations";
import { cn } from "@/lib/utils";
import { DistanceDialog, type DistancePair } from "./distance-dialog";

type DistancesPanelProps = {
  /** Training centres only: customer sites would blow the matrix up. */
  locations: Pick<Location, "id" | "code" | "name">[];
  distances: LocationDistance[];
};

/**
 * Tab «Reisezeiten»: symmetric matrix of the travel times between the training centres, in
 * minutes. A click on a cell sets or corrects the pair; the values feed the travel soft constraint.
 */
export function DistancesPanel({ locations, distances }: DistancesPanelProps) {
  // The dialog keeps its last pair while closing, so the text does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pair, setPair] = useState<DistancePair | undefined>();

  const minutes = new Map(
    distances.map((distance) => [`${distance.fromLocation.id}:${distance.toLocation.id}`, distance.travelMinutes]),
  );

  function openPair(from: DistancesPanelProps["locations"][number], to: DistancesPanelProps["locations"][number]) {
    setPair({
      from: { id: from.id, name: from.name },
      to: { id: to.id, name: to.name },
      travelMinutes: minutes.get(`${from.id}:${to.id}`) ?? null,
    });
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Reisezeit in Minuten, in beide Richtungen gleich. Zum Erfassen oder Korrigieren eine Zelle anklicken.
      </p>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                Von \ Nach
              </th>
              {locations.map((location) => (
                <th
                  key={location.id}
                  title={location.name}
                  className="px-2 py-2.5 text-center font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
                >
                  {location.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <th className="max-w-48 truncate px-4 py-2 text-left font-medium" title={row.name}>
                  {row.name}
                </th>
                {locations.map((column) => {
                  if (row.id === column.id) {
                    return (
                      <td key={column.id} className="px-2 py-1 text-center text-muted-foreground/40">
                        –
                      </td>
                    );
                  }
                  const value = minutes.get(`${row.id}:${column.id}`);
                  return (
                    <td key={column.id} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        aria-label={`Reisezeit ${row.name} – ${column.name}`}
                        onClick={() => openPair(row, column)}
                        className={cn(
                          "min-w-10 rounded-md px-2 py-1 font-mono tabular-nums outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                          value === undefined && "text-muted-foreground/50",
                        )}
                      >
                        {value ?? "+"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pair ? <DistanceDialog open={dialogOpen} onOpenChange={setDialogOpen} pair={pair} /> : null}
    </div>
  );
}
