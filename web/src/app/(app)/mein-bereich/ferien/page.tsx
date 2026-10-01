import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Ferien" };

export default function FerienPage() {
  return (
    <>
      <PageHeader title="Ferien" />
      <PlaceholderCard>Kommt mit dem Ausbilder-Bereich.</PlaceholderCard>
    </>
  );
}
