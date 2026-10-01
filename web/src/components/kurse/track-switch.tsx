"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRACK_LABELS, type Track } from "@/lib/format";

/**
 * EFZ / EBA switch of the Bildungsplan, kept in `?lehrgang=`. Switching drops `?jahrgang=`,
 * because a Jahrgang belongs to one Lehrgang; the page then picks the newest of the new track.
 */
export function TrackSwitch({ track }: { track: Track }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(() => {
      router.replace(`${pathname}?lehrgang=${next}`, { scroll: false });
    });
  }

  return (
    <Tabs value={track} onValueChange={handleChange}>
      <TabsList aria-label="Lehrgang" aria-busy={isPending}>
        {Object.entries(TRACK_LABELS).map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="px-3">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
