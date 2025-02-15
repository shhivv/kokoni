"use client"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "~/components/ui/context-menu"
import { Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { api } from "~/trpc/react"
import { useToast } from "~/hooks/use-toast"

export function SearchList() {
  const router = useRouter()
  const pathname = usePathname()
  const currentId = pathname.split("/")[1] // Get the ID from the URL
  const { toast } = useToast()

  // Query to get all searches
  const { data: searches, refetch: refetchSearches } = api.search.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Mutation to delete a search
  const deleteSearch = api.search.delete.useMutation({
    onSuccess: async () => {
      await refetchSearches()
      toast({
        title: "Success",
        description: "Search deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Handler for deleting a search
  const handleDeleteSearch = (id: string) => {
    deleteSearch.mutate({ id })
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Searches</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {searches?.map((search) => (
            <ContextMenu key={search.id}>
              <ContextMenuTrigger>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={search.id === currentId}
                    onClick={() => router.push(`/${search.id}`)}
                  >
                    <button>
                      <Search className="h-4 w-4" />
                      <span>{search.name}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteSearch(search.id)}
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
} 