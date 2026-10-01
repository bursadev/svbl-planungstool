import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Zeitplan" };

export default function ZeitplanPage() {
  return (
    <>
      <PageHeader title="Zeitplan" />
      <PlaceholderCard>Kommt mit dem Zeitplan.</PlaceholderCard>
    </>
  );
}
