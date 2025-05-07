"use client";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface ReportProps {
  searchId: string;
}

export function Report({ searchId }: ReportProps) {
  const { data: blocks, isLoading } = api.report.getReport.useQuery({
    searchId: searchId,
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

  if (!blocks || blocks.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        No report available yet.
      </div>
    );
  }

  return (
    <div className="p-4">
      <Accordion type="multiple" className="w-full">
        {blocks.map((block) => {
          // Extract heading from the markdown content
          const heading = block.heading;
          const content = block.content;

          return (
            <AccordionItem key={block.id}  value={block.id.toString()}>
              <AccordionTrigger>{heading}</AccordionTrigger>
              <AccordionContent>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {content}
                </ReactMarkdown>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
