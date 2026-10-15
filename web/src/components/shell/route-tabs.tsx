"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type RouteTab = {
  label: string;
  href: string;
  /** Active only on the exact route (for the hub's index tab); default: also on sub-routes. */
  exact?: boolean;
};

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Link bar under a hub's header, styled like the line variant of `UrlTabs`: each tab is a real
 * route, so every page of the hub keeps the bar and the browser history. For facets of one record
 * (`?tab=`) use `UrlTabs` instead.
 */
export function RouteTabs({ label, tabs }: { label: string; tabs: RouteTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href, tab.exact ?? false);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex h-8 items-center px-2.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors outline-none hover:text-foreground focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
              active && "text-foreground after:opacity-100",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
