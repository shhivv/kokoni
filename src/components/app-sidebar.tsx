import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu"
import { User2, ChevronUp, Plus } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { auth } from "~/server/auth"
import { SearchList } from "~/components/search-list"

export async function AppSidebar() {
  const session = await auth()

  return (
    <Sidebar>
      <SidebarHeader/>
      <SidebarContent>
        {session ? <SearchList/> : null }
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton>
          <Link href="/" className="w-full flex space-x-2 items-center">
            <Plus/><div>New Chat</div>
          </Link>
        </SidebarMenuButton>
        <SidebarMenu>
          <SidebarMenuItem>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> {session.user.name}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <Link
                      href="/api/auth/signout"
                      className="w-full"
                    >
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton>
                <Link href="/api/auth/signin" className="w-full">
                  Sign in
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
