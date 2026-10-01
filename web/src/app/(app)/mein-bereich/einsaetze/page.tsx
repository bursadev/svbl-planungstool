import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Meine Einsätze" };

export default function MeineEinsaetzePage() {
  return (
    <>
      <PageHeader title="Meine Einsätze" />
      <PlaceholderCard>Kommt mit dem Einsatzkalender.</PlaceholderCard>
    </>
  );
}
