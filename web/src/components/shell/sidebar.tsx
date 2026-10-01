"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { roleFromMetadata } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { isActiveRoute, navForRole } from "./nav";
import { UserCard } from "./user-card";

/** Fixed 220px navigation column with role-dependent groups and the user card at the bottom. */
export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const groups = isLoaded ? navForRole(roleFromMetadata(user?.publicMetadata)) : null;

  return (
    <nav
      aria-label="Hauptnavigation"
      className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4"
    >
      <Link href="/" className="flex items-center gap-2 px-2 pt-1 pb-4 font-semibold">
        <span aria-hidden className="size-7 rounded-lg bg-primary" />
        SVBL Planung
      </Link>

      {groups ? (
        groups.map((group) => (
          <div key={group.title}>
            <div className="px-2.5 pt-3.5 pb-1 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {group.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted",
                        active && "bg-accent-soft font-medium text-accent hover:bg-accent-soft",
                      )}
                    >
                      <span aria-hidden className={cn("size-1.5 rounded-full", active ? "bg-accent" : "bg-border")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <div className="flex flex-col gap-2 px-2.5 pt-3.5" aria-hidden>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      <div className="mt-auto border-t border-border pt-3">
        <UserCard />
      </div>
    </nav>
  );
}
