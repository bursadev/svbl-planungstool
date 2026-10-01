"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type LinkRowProps = ComponentProps<typeof TableRow> & { href: string };

/**
 * Table row that navigates to `href` on click. Clicks on links, buttons or inputs inside the row
 * are left to those elements, so the primary cell can hold a real `<Link>` for keyboard users.
 */
export function LinkRow({ href, className, onClick, ...props }: LinkRowProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [role=menuitem]")) return;
    if (event.metaKey || event.ctrlKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  }

  return <TableRow className={cn("cursor-pointer", className)} onClick={handleClick} {...props} />;
}
