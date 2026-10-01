import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";

/** App shell: fixed sidebar on the left, page content (with its own `PageHeader`) on the right. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-6">{children}</div>
      </main>
    </div>
  );
}
