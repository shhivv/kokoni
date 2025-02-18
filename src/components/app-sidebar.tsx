import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar"
import { auth } from "~/server/auth"
import { SearchList } from "~/components/search-list"
import { SidebarHeader as AnimatedHeader } from "~/components/sidebar-header"
import { SidebarActions } from "~/components/sidebar-actions"

export async function AppSidebar() {
  const session = await auth()

  return (
    <Sidebar className="border-r border-neutral-800">
      <SidebarHeader className="p-4 border-b border-neutral-800">
        <AnimatedHeader />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {session ? <SearchList /> : null}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-neutral-800 space-y-2">
        <SidebarActions
          session={
            session
              ? { ...session, user: { ...session.user, name: session.user.name ?? "Anonymous" } }
              : null
          }
        />
      </SidebarFooter>
    </Sidebar>
  )
}
