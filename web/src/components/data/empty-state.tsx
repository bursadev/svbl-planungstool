import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Muted, centred line for an empty list, e.g. «Keine Standorte gefunden.» */
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 py-8 text-center text-sm text-muted-foreground", className)}>{children}</div>;
}
