"use client"

import { motion } from "framer-motion"

export function SidebarHeader() {
  return (
    <motion.div
      className="flex items-center gap-2 px-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-xl font-heading mt-1 font-bold text-muted-foreground">
        ᲈ Kokoni
      </span>
    </motion.div>
  )
} 