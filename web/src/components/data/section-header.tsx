import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  /** Count shown next to the title in mono, e.g. the number of rows. */
  count?: number;
  /** Buttons or selects at the right edge. */
  actions?: ReactNode;
};

/** Title row of a page section («ÜK-Module», «Jahrgänge», «Zeitfenster») with its actions. */
export function SectionHeader({ title, count, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {title}
        {count !== undefined ? (
          <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">{count}</span>
        ) : null}
      </h2>
      {actions ? <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
