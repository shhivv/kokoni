"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export function SidebarHeader() {
  return (
    <motion.div
      className="flex items-center justify-between gap-2 px-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-xl font-heading mt-1 font-bold text-muted-foreground">
        ᲈ Kokoni


      </span>
              <Button
                asChild
                type="button"
                variant="outline"
                size="icon"
                className={
                  "h-8 w-8"
                }
              >
  <Link href="/"><Plus className="w-4 h-4"/></Link>
</Button>
    </motion.div>
  )
} 