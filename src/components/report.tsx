"use client"

import { api } from "~/trpc/react"
import { cn } from "~/lib/utils"
import { Skeleton } from "~/components/ui/skeleton"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { useEffect, useState } from "react"

interface ReportProps {
  searchId: string;
}

export function Report({ searchId }: ReportProps) {
  const [streamedContent, setStreamedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: search, isLoading } = api.search.getById.useQuery({ 
    id: searchId 
  });

  // Subscribe to report generation
  const utils = api.useUtils();
  useEffect(() => {
    if (search?.Report?.contents) {
      setStreamedContent(search.Report.contents);
      return;
    }

    const subscription = utils.report.produceReport.subscribe(
      {
        originalPrompt: search?.name ?? "",
        keywords: [], // This should be populated with the selected keywords
        searchId,
      },
      {
        onStarted: () => {
          setIsGenerating(true);
          setStreamedContent("");
        },
        onData: (data) => {
          if (data.type === 'content' && data.content) {
            setStreamedContent(prev => prev + data.content);
          }
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setIsGenerating(false);
        },
        onComplete: () => {
          setIsGenerating(false);
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [search?.Report?.contents, search?.name, searchId, utils.report.produceReport]);

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

  if (!streamedContent && !isGenerating) {
    return (
      <div className="p-4 text-muted-foreground">
        No report available yet.
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full overflow-y-auto px-4 py-6",
      "prose dark:prose-invert max-w-none",
      "prose-h1:text-2xl prose-h1:font-semibold prose-h1:mt-0",
      "prose-h2:text-xl prose-h2:font-semibold",
      "prose-p:text-muted-foreground",
      "prose-li:text-muted-foreground",
      "prose-strong:text-foreground",
      "prose-code:text-foreground prose-code:bg-card prose-code:rounded prose-code:px-1",
      "prose-pre:bg-card prose-pre:border prose-pre:border-border",
      "prose-blockquote:border-l-border prose-blockquote:text-muted-foreground",
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
    )}>
      <h1>{search?.name}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {streamedContent}
      </ReactMarkdown>
      {isGenerating && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
          <span className="text-sm">Generating report...</span>
        </div>
      )}
    </div>
  );
} 