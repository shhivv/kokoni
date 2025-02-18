"use client"

import { Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function SidebarHeader() {
  return (
    <motion.div
      className="flex items-center gap-2 px-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Sparkles className="w-5 h-5 text-neutral-400" />
      <span className="text-xl font-serif italic font-semibold text-neutral-200">
        Kokoni
      </span>
    </motion.div>
  )
} 