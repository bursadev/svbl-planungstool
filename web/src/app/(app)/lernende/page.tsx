import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Lernende" };

export default function LernendePage() {
  return (
    <>
      <PageHeader title="Lernende" />
      <PlaceholderCard>Kommt mit den Lernenden.</PlaceholderCard>
    </>
  );
}
