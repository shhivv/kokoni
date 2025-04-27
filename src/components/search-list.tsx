"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { useState, useCallback, useEffect } from "react";

export function SearchList() {
  const router = useRouter();
  const pathname = usePathname();
  const currentId = pathname.split("/").pop();
  const [isNavigating, setIsNavigating] = useState(false);

  const { data: searches, isLoading } = api.search.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Cache data for 30 seconds
  });

  // Prefetch all search routes
  useEffect(() => {
    if (searches) {
      searches.forEach((search) => {
        router.prefetch(`/${search.id}`);
      });
    }
  }, [searches, router]);

  // Mutation to delete a search
  // const deleteSearch = api.search.delete.useMutation({
  //   onSuccess: async () => {
  //     await refetchSearches()
  //     toast({
  //       title: "Success",
  //       description: "Search deleted successfully",
  //     })
  //   },
  //   onError: (error) => {
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive",
  //     })
  //   },
  // })

  // Handler for deleting a search
  // const _handleDeleteSearch = (id: string) => {
  //   deleteSearch.mutate({ id })
  // }

  const handleNavigate = useCallback(
    async (id: string) => {
      if (id === currentId) return; // Don't navigate if already on the page

      try {
        setIsNavigating(true);
        router.push(`/${id}`);
      } finally {
        // Add a small delay before enabling navigation again to prevent double-clicks
        setTimeout(() => setIsNavigating(false), 300);
      }
    },
    [router, currentId],
  );

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="font-label">
          Your Searches
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {Array.from({ length: 3 }).map((_, i) => (
              <SidebarMenuSkeleton key={i} showIcon />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-label">
        Your Searches
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {searches?.map((search) => (
            <SidebarMenuItem key={search.id}>
              <SidebarMenuButton
                asChild
                isActive={search.id === currentId}
                onClick={() => handleNavigate(search.id)}
                disabled={isNavigating}
              >
                <button
                  className="py-3"
                  onMouseEnter={() => router.prefetch(`/${search.id}`)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{search.name}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
