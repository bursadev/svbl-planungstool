import type { ReactNode } from "react";
import { HeaderDate } from "./header-date";

type PageHeaderProps = {
  title: string;
  /** Buttons for the page, rendered at the right edge. */
  actions?: ReactNode;
};

/** Title row every app page renders first: title, today's date and ISO week, actions on the right. */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex min-h-8 flex-wrap items-center gap-3">
      <h1 className="text-lg font-semibold tracking-[-0.01em]">{title}</h1>
      <HeaderDate />
      {actions ? <div className="ms-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
