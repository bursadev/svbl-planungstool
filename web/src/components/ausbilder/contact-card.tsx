"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { MetaItem } from "@/components/data";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Instructor } from "@/lib/api/instructors";
import { ContactDialog } from "./contact-dialog";
import type { LocationOption } from "./options";

type ContactCardProps = {
  instructor: Instructor;
  locations: LocationOption[];
};

const Empty = () => <span className="text-muted-foreground">–</span>;

/** «Kontakt»: e-mail, phone, home location, travel limit and preferred locations, with its edit dialog. */
export function ContactCard({ instructor, locations }: ContactCardProps) {
  const [editing, setEditing] = useState(false);

  const preferredIds = instructor.preferences?.preferredLocationIds ?? [];
  const preferred = locations.filter((location) => preferredIds.includes(location.id));
  // Ids the picker does not know (a deleted Standort) still count, so the user sees something is set.
  const unknownPreferred = preferredIds.length - preferred.length;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Kontakt</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon data-icon="inline-start" />
            Bearbeiten
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          <MetaItem label="E-Mail">
            {instructor.email ? (
              <a href={`mailto:${instructor.email}`} className="text-accent hover:underline">
                {instructor.email}
              </a>
            ) : (
              <Empty />
            )}
          </MetaItem>
          <MetaItem label="Telefon">
            {instructor.phone ? (
              <a href={`tel:${instructor.phone}`} className="text-accent hover:underline">
                {instructor.phone}
              </a>
            ) : (
              <Empty />
            )}
          </MetaItem>
          <MetaItem label="Heimstandort">
            <Link href={`/standorte/${instructor.homeLocation.id}`} className="hover:underline">
              {instructor.homeLocation.name}
            </Link>
          </MetaItem>
          <MetaItem label="Max. Reisezeit">
            {instructor.maxTravelMinutes !== null ? (
              <span className="font-mono tabular-nums">{instructor.maxTravelMinutes} min</span>
            ) : (
              <Empty />
            )}
          </MetaItem>
          <MetaItem label="Bevorzugte Standorte">
            {preferred.length > 0 || unknownPreferred > 0 ? (
              <span>
                {preferred.map((location) => location.name).join(", ")}
                {unknownPreferred > 0 ? (
                  <span className="text-muted-foreground">
                    {preferred.length > 0 ? ", " : ""}
                    {unknownPreferred} unbekannt
                  </span>
                ) : null}
              </span>
            ) : (
              <Empty />
            )}
          </MetaItem>
        </dl>
      </CardContent>
      <ContactDialog open={editing} onOpenChange={setEditing} instructor={instructor} locations={locations} />
    </Card>
  );
}
