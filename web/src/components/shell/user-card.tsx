"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/format";
import { roleFromMetadata } from "@/lib/roles";

/** Clerk's user menu with display name and German role label. */
export function UserCard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center gap-2.5 px-1.5" aria-hidden>
        <Skeleton className="size-7 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    );
  }

  const role = roleFromMetadata(user.publicMetadata);
  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "–";

  return (
    <div className="flex items-center gap-2.5 px-1.5">
      <UserButton />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">{role ? ROLE_LABELS[role] : "Keine Rolle"}</div>
      </div>
    </div>
  );
}
