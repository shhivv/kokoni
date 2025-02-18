"use client"

import { api } from "~/trpc/react"
import { cn } from "~/lib/utils"
import { Skeleton } from "~/components/ui/skeleton"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface ReportProps {
  searchId: string;
}

export function Report({ searchId }: ReportProps) {
  const { data: search, isLoading } = api.search.getById.useQuery({ 
    id: searchId 
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
    )
  }

  if (!search?.Report?.contents) {
    return (
      <div className="p-4 text-neutral-400">
        No report available yet.
      </div>
    )
  }

  return (
    <div className={cn(
      "h-full overflow-y-auto px-4 py-6",
      "prose prose-invert max-w-none",
      "prose-h1:text-2xl prose-h1:font-semibold prose-h1:mt-0",
      "prose-h2:text-xl prose-h2:font-semibold",
      "prose-p:text-neutral-300",
      "prose-li:text-neutral-300",
      "prose-strong:text-neutral-200",
      "prose-code:text-neutral-200 prose-code:bg-neutral-800 prose-code:rounded prose-code:px-1",
      "prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700",
      "prose-blockquote:border-l-neutral-700 prose-blockquote:text-neutral-400",
      "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
    )}>
      <h1>{search.name}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {search.Report.contents as string}
      </ReactMarkdown>
    </div>
  )
} 