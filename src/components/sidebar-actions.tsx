"use client";

import { User2, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem } from "~/components/ui/sidebar";
import { Button } from "./ui/button";

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
      {/* {session ? (
        <MotionLink
          href="/"
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-md",
            "text-sm text-muted-foreground hover:text-foreground",
            "bg-background/50 hover:bg-accent",
            "border border-border hover:border-accent",
            "transition-all duration-200 ease-in-out"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span>New Search</span>
        </MotionLink>
      ) : null} */}

      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            asChild
            className="font-label text-xs text-muted-foreground"
            variant="link"
          >
            <Link href="/about">Learn more</Link>
          </Button>{" "}
          <Button
            asChild
            className="font-label text-xs text-muted-foreground"
            variant="link"
          >
            <Link href="https://github.com/shhivv/kokoni">GitHub</Link>
          </Button>
        </SidebarMenuItem>
        <SidebarMenuItem>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-4",
                    "text-sm text-muted-foreground hover:text-foreground",
                    "bg-muted hover:bg-accent",
                    "transition-all duration-200",
                  )}
                >
                  <User2 className="h-4 w-4" />
                  <span className="ml-2 flex-1 text-left">
                    {session.user.name}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] bg-background">
                <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground">
                  <Link href="/api/auth/signout" className="w-full">
                    Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/api/auth/signin"
              className={cn(
                "flex w-full items-center rounded-md px-3 py-4",
                "text-sm text-muted-foreground hover:text-foreground",
                "bg-muted hover:bg-accent",
                "transition-all duration-200",
              )}
            >
              <User2 className="h-4 w-4" />
              <span>Sign in</span>
            </Link>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
