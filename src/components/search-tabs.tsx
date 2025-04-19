"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Flow } from "~/components/flow"
import { Report } from "~/components/report"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function SearchTabs({ searchId }: { searchId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "knowledge-map";


  const onTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="h-full flex flex-col">
      <div>
        <TabsList className="m-4">
          <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
          <TabsTrigger value="response">Report</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="response" className="flex-1 overflow-hidden">
        <Report searchId={searchId} />
      </TabsContent>
      
      <TabsContent value="knowledge-map" className="flex-1 overflow-hidden">
        <Flow />
      </TabsContent>
    </Tabs>
  );
} 