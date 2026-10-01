import type { ReactNode } from "react";
import { MetaItem, MetaList } from "@/components/data/meta";
import { Card, CardContent } from "@/components/ui/card";
import type { Apprentice } from "@/lib/api/apprentices";
import { LANGUAGE_LABELS, formatAddress, formatDate } from "@/lib/format";
import { GENDER_LABELS } from "@/lib/labels";

const dash = <span className="text-muted-foreground">–</span>;

function text(value: string | null | undefined): ReactNode {
  return value ? value : dash;
}

function date(value: string | null | undefined): ReactNode {
  return value ? <span className="font-mono tabular-nums">{formatDate(value)}</span> : dash;
}

/** Tab «Stammdaten»: the read-only fields from the school export, in a labelled grid. */
export function ApprenticeStammdaten({ apprentice }: { apprentice: Apprentice }) {
  const address = formatAddress(apprentice);
  const trainer = apprentice.trainer;

  return (
    <Card size="sm">
      <CardContent>
        <MetaList className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <MetaItem label="Geburtsdatum">{date(apprentice.birthDate)}</MetaItem>
          <MetaItem label="Geschlecht">{apprentice.gender ? GENDER_LABELS[apprentice.gender] : dash}</MetaItem>
          <MetaItem label="Sprache">{LANGUAGE_LABELS[apprentice.language]}</MetaItem>
          <MetaItem label="Muttersprache">{text(apprentice.nativeLanguage)}</MetaItem>
          <MetaItem label="Berufsnummer">
            {apprentice.professionCode ? <span className="font-mono">{apprentice.professionCode}</span> : dash}
          </MetaItem>
          <MetaItem label="AHV-Nummer">
            {apprentice.ahvNumber ? (
              <span className="font-mono tabular-nums">{apprentice.ahvNumber}</span>
            ) : (
              <span className="text-muted-foreground">nicht sichtbar</span>
            )}
          </MetaItem>
          <MetaItem label="E-Mail">
            {apprentice.email ? (
              <a href={`mailto:${apprentice.email}`} className="text-accent hover:underline">
                {apprentice.email}
              </a>
            ) : (
              dash
            )}
          </MetaItem>
          <MetaItem label="Telefon">
            {apprentice.phone ? (
              <a href={`tel:${apprentice.phone}`} className="text-accent hover:underline">
                {apprentice.phone}
              </a>
            ) : (
              dash
            )}
          </MetaItem>
          <MetaItem label="Adresse" className="col-span-2">
            {address || dash}
          </MetaItem>
          <MetaItem label="Lehrbeginn">{date(apprentice.apprenticeshipStart)}</MetaItem>
          <MetaItem label="Lehrende">{date(apprentice.apprenticeshipEnd)}</MetaItem>
          <MetaItem label="BM1">{apprentice.hasBm1 ? "Ja" : "Nein"}</MetaItem>
          <MetaItem label="Berufsschule">
            {apprentice.vocationalSchool.name}
            <span className="text-muted-foreground"> · {apprentice.vocationalSchool.shortName}</span>
          </MetaItem>
          <MetaItem label="Klasse">
            {apprentice.schoolClass ? <span className="font-mono">{apprentice.schoolClass.code}</span> : dash}
          </MetaItem>
          <MetaItem label="Lehrbetrieb">{text(apprentice.trainingCompany?.name)}</MetaItem>
          <MetaItem label="Berufsbildner" className="col-span-2">
            {trainer ? (
              <span className="inline-flex flex-wrap items-center gap-x-2">
                <span>
                  {trainer.firstName} {trainer.lastName}
                </span>
                {trainer.email ? (
                  <a href={`mailto:${trainer.email}`} className="text-accent hover:underline">
                    {trainer.email}
                  </a>
                ) : null}
                {trainer.phone ? (
                  <a href={`tel:${trainer.phone}`} className="text-accent hover:underline">
                    {trainer.phone}
                  </a>
                ) : null}
              </span>
            ) : (
              dash
            )}
          </MetaItem>
          <MetaItem label="Importiert am">{date(apprentice.importedAt)}</MetaItem>
        </MetaList>
      </CardContent>
    </Card>
  );
}
