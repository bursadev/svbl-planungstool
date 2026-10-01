import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Geräte" };

export default function GeraetePage() {
  return (
    <>
      <PageHeader title="Geräte" />
      <PlaceholderCard>Kommt mit den Geräten.</PlaceholderCard>
    </>
  );
}
