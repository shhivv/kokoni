"use client"

import { Plus, User2, ChevronUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "~/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "~/components/ui/sidebar"

const MotionLink = motion.create(Link)

interface SidebarActionsProps {
  session: {
    user: {
      name: string;
    };
  } | null;
}

export function SidebarActions({ session }: SidebarActionsProps) {
  return (
    <>
      {session ? (
        <MotionLink
          href="/"
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-md",
            "text-sm text-neutral-400 hover:text-neutral-200",
            "bg-background/50 hover:bg-neutral-800/50",
            "border border-neutral-800 hover:border-neutral-700",
            "transition-all duration-200 ease-in-out"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span>New Search</span>
        </MotionLink>
      ) : null}

      <SidebarMenu>
        <SidebarMenuItem>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground w-full",
                  "bg-background/50 hover:bg-accent",
                )}
              >
                <SidebarMenuButton className={cn(
                  "w-full px-3 py-2 rounded-md",
                  "text-sm text-neutral-400 hover:text-neutral-200",
                  "bg-background/50 hover:bg-neutral-800/50",
                  "border border-neutral-800 hover:border-neutral-700",
                  "transition-all duration-200"
                )}>
                  <User2 className="w-4 h-4" />
                  <span className="flex-1 text-left ml-2">{session.user.name}</span>
                  <ChevronUp className="w-4 h-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] bg-background border border-border"
              >
                <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground">
                  <Link href="/api/auth/signout" className="w-full">
                    Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SidebarMenuButton className={cn(
              "w-full px-3 py-5 rounded-md",
              "text-sm text-neutral-400 hover:text-neutral-200",
              "bg-background/50 hover:bg-neutral-800/50",
              "border border-neutral-800 hover:border-neutral-700",
              "transition-all duration-200"
            )}>
              <Link href="/api/auth/signin" className="w-full flex items-center gap-2">
                <User2 className="w-4 4-4" />
                <span>Sign in</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
} 