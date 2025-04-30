import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Node } from "~/types/NodeInterface";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { ImageIcon, BarChart2Icon, FileTextIcon } from "lucide-react";

interface KokoniNodeData extends Node {
  isLoading?: boolean;
  summaryLoading?: boolean;
  showImage?: boolean;
  showStats?: boolean;
  showVerbose?: boolean;
  onToggleImage?: (value: boolean) => void;
  onToggleStats?: (value: boolean) => void;
  onToggleVerbose?: (value: boolean) => void;
}

export const KokoniNode = memo(({ data }: { data: KokoniNodeData }) => {
  if (data.isLoading) {
    return (
      <div className="w-72 rounded-md border border-neutralborder bg-muted/50 px-4 py-4 shadow-md">
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="h-2 w-2"
        />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="h-2 w-2"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-72 ${data.selected ? "bg-muted py-8" : "bg-muted/50 py-4"} rounded-md border border-neutralborder px-4 shadow-md`}
    >
      {data.parentId ? (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="h-2 w-2"
        />
      ) : null}
      <div className="flex flex-col gap-4">
        <div
          className={`text-sm font-medium ${data.selected ? "text-foreground" : "text-muted-foreground/60"}`}
        >
          {data.question}
        </div>
        {data.summaryLoading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          data.summary && (
            <div className="text-xs text-neutral-500">{data.summary}</div>
          )
        )}

        {data.selected && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => data.onToggleImage?.(!data.showImage)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                data.showImage
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => data.onToggleStats?.(!data.showStats)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                data.showStats
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <BarChart2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => data.onToggleVerbose?.(!data.showVerbose)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                data.showVerbose
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <FileTextIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="h-2 w-2"
      />
    </div>
  );
});
