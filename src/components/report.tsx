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
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
    );
  }

  if (!search?.Report?.contents) {
    return (
      <div className="p-4 text-muted-foreground">
        No report available yet.
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full overflow-y-auto px-4 py-6 font-label flex flex-col items-center",
      "prose dark:prose-invert max-w-none",
      "prose-h1:text-2xl prose-h1:font-semibold prose-h1:mt-0 prose-h1:font-heading",
      "prose-h2:text-xl prose-h2:font-medium prose-h1:font-heading",
      "prose-p:text-muted-foreground",
      "prose-li:text-muted-foreground",
      "prose-strong:text-foreground",
      "prose-code:text-foreground prose-code:bg-card prose-code:rounded prose-code:px-1",
      "prose-pre:bg-card prose-pre:border prose-pre:border-border",
      "prose-blockquote:border-l-border prose-blockquote:text-muted-foreground",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
    )}>
      <div className="w-3/5">

      <p className="text-sm">{search.name}</p>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {search.Report.contents}
      </ReactMarkdown>
      </div>
    </div>
  );
} 