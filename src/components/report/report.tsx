"use client";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import '@mdxeditor/editor/style.css';
import { ScrollArea } from "~/components/ui/scroll-area";
import { Editor } from "./editor";
import { useEffect, useState } from "react";

interface ReportProps {
  searchId: string;
}

export function Report({ searchId }: ReportProps) {
  const { data: blocks, isLoading } = api.report.getReport.useQuery({
    searchId: searchId,
  });

  const updateBlock = api.report.updateReportBlock.useMutation();

  const [blockContents, setBlockContents] = useState<Record<number, string>>({});

  useEffect(() => {
    if (blocks) {
      const initialContents = blocks.reduce((acc, block) => {
        acc[block.id] = block.content;
        return acc;
      }, {} as Record<number, string>);
      setBlockContents(initialContents);
    }
  }, [blocks]);

  useEffect(() => {
    const timeouts: Record<number, NodeJS.Timeout> = {};

    const saveBlock = async (blockId: number, content: string) => {
      try {
        await updateBlock.mutateAsync({
          reportBlockId: blockId,
          content: content,
        });
      } catch (error) {
        console.error('Failed to save block:', error);
      }
    };

    Object.entries(blockContents).forEach(([blockId, content]) => {
      const id = parseInt(blockId);
      if (content !== blocks?.find(b => b.id === id)?.content) {
        if (timeouts[id]) {
          clearTimeout(timeouts[id]);
        }
        timeouts[id] = setTimeout(() => {
          void saveBlock(id, content);
        }, 1000);
      }
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [blockContents, blocks, updateBlock]);

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
    <div className="p-4 flex justify-center bg-card">
      <div className="w-1/2">
        <Accordion type="multiple" className="w-full" defaultValue={blocks.map((block) => block.id.toString())}>
          {blocks.map((block) => {
            return (
              <AccordionItem key={block.id} value={block.id.toString()}>
                <AccordionTrigger className="text-lg font-bold font-heading">{block.heading}</AccordionTrigger>
                <AccordionContent>
                  <Editor
                    autoFocus={{ defaultSelection: 'rootEnd' }}
                    contentEditableClassName="twindprose"
                    className="dark-theme"
                    markdown={blockContents[block.id] || block.content}
                    onChange={(newContent) => {
                      setBlockContents(prev => ({
                        ...prev,
                        [block.id]: newContent
                      }));
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
