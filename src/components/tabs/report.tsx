"use client";

import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface ReportProps {
  searchId: string;
}

export function Report({ searchId }: ReportProps) {
  const { data: search, isLoading } = api.search.getById.useQuery({
    id: searchId,
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


  return <></>
}
