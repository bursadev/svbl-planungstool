"use client";

import type { ReactNode } from "react";
import { ArchiveFilter, CsvMenu, ResetFilters, SearchInput } from "@/components/data";

type CatalogToolbarProps = {
  /** API base path of the catalogue, e.g. `/skills`. */
  basePath: string;
  /** Plural for the CSV dialog: «Skills importieren». */
  plural: string;
  searchPlaceholder: string;
  /** API filters of the current view, for «Gefilterte Ansicht exportieren». */
  filters: Record<string, string | undefined>;
  filtered: boolean;
  /** The create button. */
  children: ReactNode;
};

/**
 * Toolbar of one Kataloge tab: search, archive filter and reset on the left, CSV menu and the
 * create button on the right. All tabs share `?q=` and `?archiv=`, so a search filters every tab
 * and the tab counts show the hits.
 */
export function CatalogToolbar({ basePath, plural, searchPlaceholder, filters, filtered, children }: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput placeholder={searchPlaceholder} className="w-72" />
      <ArchiveFilter />
      <ResetFilters />
      <div className="ms-auto flex items-center gap-2">
        <CsvMenu basePath={basePath} plural={plural} filters={filters} filtered={filtered} />
        {children}
      </div>
    </div>
  );
}
