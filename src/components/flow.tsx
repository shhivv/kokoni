"use client";
import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  type SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";


export const Flow: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const { data: search } = api.search.getById.useQuery({
    id: params.slug,
  });
  const selectNode = api.search.selectNode.useMutation();
  const [prompt, setPrompt] = useState("")
 
  return (
    <div className="floating-edges relative h-full w-full bg-card">
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.5,
          maxZoom: 1.5,
        }}
        className="bg-background"
        nodesDraggable={true}
        nodesConnectable={false}
        panOnDrag
        minZoom={0.2}
        maxZoom={1.5}
        selectionMode={"multi" as unknown as SelectionMode}
        selectNodesOnDrag={false}
        multiSelectionKeyCode="Shift"
      ></ReactFlow>

      {/* Prompt Input */}
      <div className="absolute bottom-8 left-1/2 w-[600px] -translate-x-1/2">
        <div className="relative">
          <div className="relative">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add additional instructions for the report..."
              className="h-12 w-full rounded-lg border border-border bg-card px-4 pr-[220px] text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
              <div className="mx-2 h-8 w-px bg-border" />
              <Button
                onClick={() => {
                }}
                disabled={false}
                className="h-8 rounded-md bg-primary px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {false ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/20 border-t-background" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};
