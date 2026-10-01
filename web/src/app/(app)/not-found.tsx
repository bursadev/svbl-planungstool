import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { PlaceholderCard } from "@/components/shell/placeholder-card";

/** Rendered inside the app shell when a page calls `notFound()`, e.g. `/standorte/<unknown id>`. */
export default function NotFound() {
  return (
    <>
      <PageHeader title="Nicht gefunden" />
      <PlaceholderCard>
        Der Eintrag existiert nicht oder wurde gelöscht.{" "}
        <Link href="/" className="text-accent hover:underline">
          Zum Dashboard
        </Link>
      </PlaceholderCard>
    </>
  );
}
