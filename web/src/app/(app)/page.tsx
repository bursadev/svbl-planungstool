import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

const QUICK_LINKS = [
  { title: "Standorte", description: "Ausbildungszentren mit Räumen und Geräten.", href: "/standorte" },
  { title: "Ausbilder", description: "Skills, Zertifikate und Verfügbarkeit.", href: "/ausbilder" },
  { title: "Kurstypen", description: "Anforderungen an Skills, Zertifikate und Geräte.", href: "/kurse/typen" },
] as const;

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <section aria-label="Schnellzugriff" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Card size="sm" className="h-full transition-shadow hover:ring-input">
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </>
  );
}
