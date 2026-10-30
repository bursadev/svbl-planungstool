"use client";

import { UrlSelect } from "./url-select";

const OPTIONS = [
  { value: "aktiv", label: "Aktive" },
  { value: "archiviert", label: "Archivierte" },
  { value: "alle", label: "Aktive und archivierte" },
];

/** Status filter of every Stammdaten list: `?archiv=archiviert|alle`; archived rows are hidden by default. */
export function ArchiveFilter({ className = "w-52" }: { className?: string }) {
  return <UrlSelect param="archiv" label="Archiv" options={OPTIONS} defaultValue="aktiv" className={className} />;
}
