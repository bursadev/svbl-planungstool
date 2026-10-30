"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/list-params";

type PaginationProps = {
  total: number;
  page: number;
  pageSize: number;
};

const count = new Intl.NumberFormat("de-CH");

/**
 * «1–50 von 5'435» with previous / next and the page size, all in the URL (`?seite=&proSeite=`).
 * Renders the count alone when everything fits on one page.
 */
export function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={<Summary {...props} />}>
      <SyncedPagination {...props} />
    </Suspense>
  );
}

function Summary({ total, page, pageSize }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <span className="text-[13px] text-muted-foreground tabular-nums">
      {from > total ? count.format(total) : `${count.format(from)}–${count.format(to)}`} von {count.format(total)}
    </span>
  );
}

function SyncedPagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function go(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function setPage(next: number) {
    go((params) => (next <= 1 ? params.delete("seite") : params.set("seite", String(next))));
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3" aria-busy={isPending}>
      <Summary total={total} page={page} pageSize={pageSize} />
      <Select
        value={String(pageSize)}
        onValueChange={(value) =>
          go((params) => {
            params.delete("seite");
            if (Number(value) === DEFAULT_PAGE_SIZE) params.delete("proSeite");
            else params.set("proSeite", value);
          })
        }
      >
        <SelectTrigger size="sm" aria-label="Einträge pro Seite" className="w-32 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size} pro Seite
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Vorherige Seite"
          disabled={page <= 1 || isPending}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-20 text-center text-[13px] tabular-nums">
          Seite {Math.min(page, pages)} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Nächste Seite"
          disabled={page >= pages || isPending}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
