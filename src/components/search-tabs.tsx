"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Flow } from "~/components/flow";
import { Report } from "~/components/report";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "~/hooks/use-toast";

export function SearchTabs({ searchId }: { searchId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "knowledge-map";
  const { toast } = useToast();

  const onTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${searchId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
    });
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={onTabChange}
      className="flex h-full flex-col bg-card"
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <TabsList className="flex">
          <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
          <TabsTrigger value="response">Report</TabsTrigger>
        </TabsList>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-9 w-9 rounded-lg bg-muted"
        >
          <Share2 className="h-4 w-4" />
        </Button>
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
