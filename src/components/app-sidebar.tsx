"use client"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "~/components/ui/context-menu"
import { User2, ChevronUp, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { api } from "~/trpc/react"
import { useToast } from "~/hooks/use-toast"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu"

export function AppSidebar() {
  const router = useRouter()
  const { toast } = useToast()

  // Query to get all searches
  const { data: searches, refetch: refetchSearches } = api.search.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Mutation to create a new search
  // const createSearch = api.search.create.useMutation({
  //   onSuccess: async () => {
  //     await refetchSearches()
  //     toast({
  //       title: "Success",
  //       description: "New search created",
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

  // Handler for creating a new search
  // const handleCreateSearch = () => {
  //   createSearch.mutate({
  //     name: `New Search ${searches?.length ?? 0 + 1}`,
  //     additionalInstruction: "",
  //   })
  // }

  // Handler for deleting a search
  const handleDeleteSearch = (id: string) => {
    deleteSearch.mutate({ id })
  }

  return (
    <Sidebar>
      <SidebarHeader/>
      <SidebarContent>
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {/* Add session user name here */}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <Link href="/api/auth/signout" className="w-full">
                    Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
