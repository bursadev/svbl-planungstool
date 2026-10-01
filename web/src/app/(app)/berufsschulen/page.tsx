import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

export const metadata: Metadata = { title: "Berufsschulen" };

export default function BerufsschulenPage() {
  return (
    <>
      <PageHeader title="Berufsschulen" />
      <PlaceholderCard>Kommt mit den Berufsschulen.</PlaceholderCard>
    </>
  );
}
