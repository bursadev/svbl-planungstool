"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type UrlTab = {
  value: string;
  label: ReactNode;
  content: ReactNode;
};

type UrlTabsProps = {
  tabs: UrlTab[];
  /** Query parameter that holds the active tab; omitted from the URL for the first tab. */
  param?: string;
  className?: string;
};

/**
 * shadcn `Tabs` whose active tab lives in the URL (`?tab=`), so detail pages can be linked to a
 * tab and survive a refresh. Switching writes the URL with `history.replaceState`, which Next's
 * router picks up without a server round trip. Tab contents are rendered by the server page.
 */
export function UrlTabs(props: UrlTabsProps) {
  return (
    <Suspense fallback={<TabsView {...props} value={props.tabs[0]?.value ?? ""} />}>
      <SyncedTabs {...props} />
    </Suspense>
  );
}

function SyncedTabs({ tabs, param = "tab", className }: UrlTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fallback = tabs[0]?.value ?? "";
  const requested = searchParams.get(param);
  const value = requested && tabs.some((tab) => tab.value === requested) ? requested : fallback;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === fallback) params.delete(param);
    else params.set(param, next);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return <TabsView tabs={tabs} value={value} onValueChange={handleChange} className={className} />;
}

type TabsViewProps = {
  tabs: UrlTab[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

function TabsView({ tabs, value, onValueChange, className }: TabsViewProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList variant="line" className="w-full justify-start border-b border-border">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="px-2.5">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-3">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
